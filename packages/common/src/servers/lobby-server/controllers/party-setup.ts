import { MAX_PARTY_NAME_LENGTH } from "../../../app-consts.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { UserSession } from "../../sessions/user-session.js";
import { SavedCharactersController } from "./saved-characters.js";
import { RANDOM_PARTY_NAMES } from "../default-names/parties.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { SpeedDungeonProfileService } from "../../services/profiles.js";
import { PartyName } from "../../../aliases.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { GameMode } from "../../../types.js";

export class PartySetupController {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly savedCharactersController: SavedCharactersController,
    private readonly profileService: SpeedDungeonProfileService,
    private readonly idGenerator: IdGenerator
  ) {}

  static getProgressionGamePartyName(gameName: string) {
    return `Delvers of ${gameName}` as PartyName;
  }

  generateRandomPartyName() {
    const result = RANDOM_PARTY_NAMES[Math.floor(Math.random() * RANDOM_PARTY_NAMES.length)];
    if (result === undefined) {
      throw new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
    }
    return result as PartyName;
  }

  createPartyHandler(session: UserSession, partyName: PartyName) {
    if (session.currentPartyName) {
      throw new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);
    }

    if (partyName === "") {
      partyName = this.generateRandomPartyName();
    }

    if (partyName.length > MAX_PARTY_NAME_LENGTH) {
      throw new Error(`Party names may be no longer than ${MAX_PARTY_NAME_LENGTH} characters`);
    }

    const game = session.getExpectedCurrentGame();

    if (game.adventuringParties.get(partyName)) {
      throw new Error(ERROR_MESSAGES.LOBBY.PARTY_NAME_EXISTS);
    }

    const party = AdventuringParty.createInitialized(this.idGenerator.generate(), partyName);
    game.addParty(party);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PartyCreated,
      data: { partyId: party.id, partyName },
    });

    const joinPartyHandlerOutbox = this.joinPartyHandler(session, party.name);
    outbox.pushFromOther(joinPartyHandlerOutbox);

    return outbox;
  }

  joinPartyHandler(session: UserSession, partyName: PartyName) {
    if (session.currentPartyName) {
      throw new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);
    }

    const game = session.getExpectedCurrentGame();

    game.putPlayerInParty(partyName, session.username);

    const partyChannelName = getPartyChannelName(game.name, partyName);

    session.subscribeToChannel(partyChannelName);
    session.currentPartyName = partyName;

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerChangedAdventuringParty,
      data: { playerName: session.username, partyName },
    });

    return outbox;
  }

  async joinProgressionGamePartyWithDefaultCharacterHandler(
    session: UserSession,
    game: SpeedDungeonGame
  ) {
    session.requireAuthorized();
    const profile = await session.requireProfile(this.profileService);
    const defaultSavedCharacter =
      await this.savedCharactersController.getDefaultSavedCharacterForProgressionGame(profile);

    const { combatant } = defaultSavedCharacter;

    game.lowestStartingFloorOptionsBySavedCharacter.set(
      combatant.getEntityId(),
      combatant.combatantProperties.deepestFloorReached
    );

    const partyName = PartySetupController.getProgressionGamePartyName(game.name);

    const party = game.getExpectedParty(partyName);
    const player = game.getExpectedPlayer(session.username);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    const joinPartyHandlerOutbox = this.joinPartyHandler(session, partyName);
    outbox.pushFromOther(joinPartyHandlerOutbox);

    game.addCharacterToParty(
      party,
      player,
      defaultSavedCharacter.combatant,
      defaultSavedCharacter.pets
    );

    game.setMaxStartingFloor();

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.CharacterAddedToParty,
      data: {
        username: session.username,
        character: defaultSavedCharacter.combatant.toSerialized(),
        pets: defaultSavedCharacter.pets.map((pet) => pet.toSerialized()),
      },
    });

    return outbox;
  }

  leavePartyHandler(session: UserSession) {
    const game = session.getExpectedCurrentGame();

    // get the reference to the party now before we maybe remove it from the game
    const party = session.getExpectedCurrentParty(game);
    const removedPlayerDataResult = game.removePlayerFromParty(session.username);
    if (removedPlayerDataResult instanceof Error) {
      throw removedPlayerDataResult;
    }

    const partyChannelName = getPartyChannelName(game.name, party.name);

    session.unsubscribeFromChannel(partyChannelName);
    session.currentPartyName = null;

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerChangedAdventuringParty,
      data: { playerName: session.username, partyName: null },
    });

    return outbox;
  }

  async selectProgressionGameStartingFloorHandler(
    session: UserSession,
    data: { floorNumber: number }
  ) {
    const game = session.getExpectedCurrentGame();

    game.requireMode(GameMode.Progression);

    const { floorNumber } = data;
    if (floorNumber > game.getMaxStartingFloor()) {
      throw new Error(ERROR_MESSAGES.GAME.STARTING_FLOOR_LIMIT);
    }

    game.selectedStartingFloor = floorNumber;
    const party = session.getExpectedCurrentParty(game);
    party.dungeonExplorationManager.setCurrentFloor(game.selectedStartingFloor);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.ProgressionGameStartingFloorSelected,
      data: { floorNumber },
    });

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.DungeonFloorNumber,
      data: { floorNumber },
    });

    return outbox;
  }
}
