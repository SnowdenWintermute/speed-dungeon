import { GameName } from "../../../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { GameLifecycleController } from "../../../controllers/game-lifecycle.js";
import { GameRegistry } from "../../../game-registry.js";
import { GameSessionStoreService } from "../../../services/game-session-store/index.js";
import { ActiveGameStatus } from "../../../services/game-session-store/active-game-status.js";
import { UserSession } from "../../../sessions/user-session.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { UserSessionRegistry } from "../../../sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { getPartyChannelName } from "../../../../packets/channels.js";
import { GameMode } from "../../../../types.js";
import { GameModeContext } from "./game-mode-context.js";
import { RaceGameRecordsService } from "../../../services/race-game-records.js";
import { SavedCharactersService } from "../../../services/saved-characters.js";
import { RankedLadderService } from "../../../services/ranked-ladder.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { PartyDelayedGameMessageFactory } from "../../party-delayed-game-message-factory.js";
import {
  createPartyAbandonedMessage,
  createPartyWipeMessage,
  GameMessageType,
} from "../../../../packets/game-message.js";

export class GameServerGameLifecycleController implements GameLifecycleController {
  // strategy pattern for handling certain events
  gameModeContexts: Record<GameMode, GameModeContext>;

  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly gameSessionStoreService: GameSessionStoreService,
    raceGameRecordsService: RaceGameRecordsService,
    savedCharactersService: SavedCharactersService,
    rankedLadderService: RankedLadderService,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory
  ) {
    this.gameModeContexts = {
      [GameMode.Race]: new GameModeContext(
        GameMode.Race,
        raceGameRecordsService,
        savedCharactersService,
        rankedLadderService
      ),
      [GameMode.Progression]: new GameModeContext(
        GameMode.Progression,
        raceGameRecordsService,
        savedCharactersService,
        rankedLadderService
      ),
    };
  }

  async getOrInitializeGame(gameName: GameName) {
    const existingGame = this.gameRegistry.getGameOption(gameName);
    if (existingGame) {
      return existingGame;
    }
    return await this.initializeExpectedPendingGame(gameName);
  }

  private async initializeExpectedPendingGame(gameName: GameName) {
    const pendingGameSetupOption = await this.gameSessionStoreService.getPendingGameSetup(gameName);
    if (pendingGameSetupOption === null) {
      throw new Error(
        "A user presented a token with a game id that didn't match any existing game or pending game setup."
      );
    }

    const newGame = pendingGameSetupOption.game;
    this.gameRegistry.registerGame(newGame);
    this.gameSessionStoreService.deletePendingGameSetup(newGame.name);

    this.gameSessionStoreService.writeActiveGameStatus(
      newGame.name,
      new ActiveGameStatus(newGame.name, newGame.id)
    );

    return newGame;
  }

  async joinGameHandler(gameName: GameName, session: UserSession) {
    const game = this.gameRegistry.requireGame(gameName);
    session.joinGame(game);
    session.subscribeToChannel(game.getChannelName());

    const player = game.getExpectedPlayer(session.username);
    const party = game.getExpectedParty(player.getExpectedPartyName());
    session.subscribeToChannel(getPartyChannelName(game.name, party.name));

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    // if they are reconnecting their client would have lost the game information
    // could avoid sending it if this is a connection from the lobby though
    // for simplicity we'll eat the performance cost until it is measured
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameFullUpdate,
      data: { game: game.getSerialized() },
    });

    // clients should handle this differently than in the lobby
    // and just mark this player as connected in their client
    outbox.pushToChannel(
      game.getChannelName(),
      {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: session.username },
      },
      { excludedIds: [session.connectionId] }
    );

    const allPlayersAreConnectedToGame = this.allPlayersAreConnectedToGame(game);
    const gameHasNotYetStarted = game.getTimeStarted() === null;

    if (gameHasNotYetStarted && allPlayersAreConnectedToGame) {
      const startGameOutbox = await this.startGame(game);
      outbox.pushFromOther(startGameOutbox);
    }

    game.inputLock.remove(session.taggedUserId.id); // @TODO - check this lock when players submit inputs

    return outbox;
  }

  private async startGame(game: SpeedDungeonGame) {
    const gameModeContext = this.gameModeContexts[game.mode];
    await gameModeContext.strategy.onGameStart(game);

    game.setAsStarted();

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.GameStarted,
      data: { timeStarted: game.requireTimeStarted() },
    });

    return outbox;
    // - we used to run the "explore next room" handler or otherwise put the parties in their first room
    //   but hopefully we don't need to do this anymore since adventuring party starts in empty room by default
  }

  private allPlayersAreConnectedToGame(game: SpeedDungeonGame) {
    let result = true;
    for (const [username, player] of Array.from(game.players)) {
      const sessions = this.userSessionRegistry.getSessionsByUsername(username);
      if (sessions.length === 0) {
        result = false;
        break;
      }
    }

    return result;
  }

  async leaveGameHandler(session: UserSession) {
    const game = session.getExpectedCurrentGame();
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerLeftGame,
      data: { username: session.username },
    });

    const player = game.getExpectedPlayer(session.username);
    const party = player.getExpectedParty(game);
    const gameModeContext = this.gameModeContexts[game.mode];
    await gameModeContext.strategy.onGameLeave(game, party, player);

    const removedPlayerData = game.removePlayerFromParty(session.username);
    const { partyWasRemoved } = removedPlayerData;

    // check if only dead players remain
    let deadPartyMembersAbandoned = false;
    if (!partyWasRemoved && party.playerUsernames.length > 0) {
      const { partyAbandoned, outbox: deadPartyMembersAbandonedOutbox } =
        this.handleAbandoningDeadPartyMembers(game, party);
      outbox.pushFromOther(deadPartyMembersAbandonedOutbox);
      deadPartyMembersAbandoned = partyAbandoned;
    }

    const partyHasNotYetEscaped = !party.timeOfEscape; // if they already escaped they shouldn't be marked as wiped
    const partyHasNotYetWiped = party.timeOfWipe === null;
    const partyIsInWipableState =
      partyWasRemoved || (deadPartyMembersAbandoned && partyHasNotYetWiped);
    const partyShouldBeMarkedWiped = partyHasNotYetEscaped && partyIsInWipableState;

    if (partyShouldBeMarkedWiped) {
      party.timeOfWipe = Date.now();
      const partyWipePayloads = await gameModeContext.strategy.onPartyWipe(game, party);

      const remainingParties = Object.values(game.adventuringParties);
      if (remainingParties.length) {
        const floorNumber = party.dungeonExplorationManager.getCurrentFloor();

        const partyWipedOutbox =
          this.partyDelayedGameMessageFactory.createMessageInGameWithOptionalDelayForParty(
            game.getChannelName(),
            GameMessageType.PartyWipe,
            createPartyWipeMessage(party.name, floorNumber, new Date(Date.now())),
            getPartyChannelName(game.name, party.name)
          );
        outbox.pushFromOther(partyWipedOutbox);
      }

      outbox.pushToChannel(game.getChannelName(), {
        type: GameStateUpdateType.ActionCommandPayloads,
        data: { payloads: partyWipePayloads },
      });
    }

    game.removePlayer(session.username);

    const noPlayersRemain = Object.keys(game.players).length === 0;
    const allPartiesWiped = game.allPartiesWiped();

    // - if there are no living parties in the game, clean up the game
    if (allPartiesWiped || noPlayersRemain) {
      await gameModeContext.strategy.onLastPlayerLeftGame(game);

      this.gameRegistry.unregisterGame(game.name);
      await this.gameSessionStoreService.deleteActiveGameStatus(game.name);
    }

    return outbox;
  }

  handleAbandoningDeadPartyMembers(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): { partyAbandoned: boolean; outbox: MessageDispatchOutbox<GameStateUpdate> } {
    let allRemainingCharactersAreDead = true;
    const partyMembers = party.combatantManager.getPartyMemberCombatants();
    for (const character of partyMembers) {
      const characterIsAlive = !character.combatantProperties.isDead();
      if (characterIsAlive) {
        allRemainingCharactersAreDead = false;
        break;
      }
    }

    if (allRemainingCharactersAreDead && !party.timeOfWipe) {
      const abandonedPartyOutbox =
        this.partyDelayedGameMessageFactory.createMessageInGameWithOptionalDelayForParty(
          game.getChannelName(),
          GameMessageType.PartyDissolved,
          createPartyAbandonedMessage(party.name),
          getPartyChannelName(game.name, party.name)
        );
      return { partyAbandoned: true, outbox: abandonedPartyOutbox };
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    return { partyAbandoned: false, outbox };
  }
}
