import { MAX_PARTY_NAME_LENGTH } from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import {
  AdventuringParty,
  GameMode,
  getPartyChannelName,
  PartyName,
  SpeedDungeonGame,
} from "../../index.js";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { LobbyState } from "../lobby-state.js";
import { SavedCharactersController } from "./saved-characters.js";
import { RANDOM_PARTY_NAMES } from "./default-naming/parties.js";
import { GameStateUpdateDispatchFactory } from "../update-delivery/game-state-update-dispatch-factory.js";
import { GameStateUpdateDispatchOutbox } from "../update-delivery/update-dispatch-outbox.js";
import { SessionAuthorizationManager } from "../sessions/authorization-manager.js";
import { UserSession } from "../sessions/user-session.js";

export class PartySetupController {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateDispatchFactory: GameStateUpdateDispatchFactory,
    private readonly savedCharactersController: SavedCharactersController,
    private readonly sessionAuthManager: SessionAuthorizationManager,
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

    const game = session.getExpectedCurrentGame(this.lobbyState);

    if (game.adventuringParties[partyName]) {
      throw new Error(ERROR_MESSAGES.LOBBY.PARTY_NAME_EXISTS);
    }

    const party = AdventuringParty.createInitialized(this.idGenerator.generate(), partyName);
    game.addParty(party);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);

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

    const game = session.getExpectedCurrentGame(this.lobbyState);

    game.putPlayerInParty(partyName, session.username);

    const partyChannelName = getPartyChannelName(game.name, partyName);

    session.subscribeToChannel(partyChannelName);
    session.currentPartyName = partyName;

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.PartyNameUpdate,
      data: { partyName },
    });

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
    const authorizedSession = await this.sessionAuthManager.requireAuthorizedSession(session);

    const defaultSavedCharacter =
      await this.savedCharactersController.getDefaultSavedCharacterForProgressionGame(
        authorizedSession
      );
    const { combatant } = defaultSavedCharacter;

    game.lowestStartingFloorOptionsBySavedCharacter[combatant.entityProperties.id] =
      combatant.combatantProperties.deepestFloorReached;

    const partyName = PartySetupController.getProgressionGamePartyName(game.name);

    const party = game.getExpectedParty(partyName);
    const player = game.getExpectedPlayer(session.username);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
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
        character: defaultSavedCharacter.combatant.getSerialized(),
        pets: defaultSavedCharacter.pets.map((pet) => pet.getSerialized()),
      },
    });

    return outbox;
  }

  leavePartyHandler(session: UserSession) {
    const game = session.getExpectedCurrentGame(this.lobbyState);

    // get the reference to the party now before we maybe remove it from the game
    const party = session.getExpectedCurrentParty(game);
    const removedPlayerDataResult = game.removePlayerFromParty(session.username);
    if (removedPlayerDataResult instanceof Error) {
      throw removedPlayerDataResult;
    }

    const partyChannelName = getPartyChannelName(game.name, party.name);

    session.unsubscribeFromChannel(partyChannelName);
    session.currentPartyName = null;

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.PartyNameUpdate,
      data: { partyName: null },
    });

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
    const game = session.getExpectedCurrentGame(this.lobbyState);

    game.requireMode(GameMode.Progression);

    const { floorNumber } = data;
    if (floorNumber > game.getMaxStartingFloor()) {
      throw new Error(ERROR_MESSAGES.GAME.STARTING_FLOOR_LIMIT);
    }

    game.selectedStartingFloor = floorNumber;
    const party = session.getExpectedCurrentParty(game);
    party.dungeonExplorationManager.setCurrentFloor(game.selectedStartingFloor);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);

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
