import { MAX_PARTY_NAME_LENGTH } from "../../../app-consts.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { UserSession } from "../../sessions/user-session.js";
import { RANDOM_PARTY_NAMES } from "../default-names/parties.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { PartyName, Username } from "../../../aliases.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CharacterControlScheme, GameMode } from "../../../game-modes/index.js";
import { AllowedResult } from "../../../primatives/index.js";

export class PartySetupController {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
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

  userMeetsCharacterControlSchemeLimits(
    username: Username,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): AllowedResult {
    const player = game.getPlayer(username);
    if (!player) {
      return { allowed: false, reason: ERROR_MESSAGES.PLAYER.NOT_IN_PARTY };
    }
    const { characterControlScheme } = game;
    const charactersInParty = player.getCharactersInParty(party);
    if (
      characterControlScheme === CharacterControlScheme.Freelancer &&
      charactersInParty.length >= 1
    ) {
      return { allowed: false, reason: ERROR_MESSAGES.PLAYER.PARTY_CHARACTER_LIMIT };
    }
    return { allowed: true };
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
    if (floorNumber > game.maxStartingFloor) {
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
