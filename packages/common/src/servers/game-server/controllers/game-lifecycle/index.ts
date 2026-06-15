import { GameId } from "../../../../aliases.js";
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
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { PartyDelayedGameMessageFactory } from "../../party-delayed-game-message-factory.js";
import {
  createPartyAbandonedMessage,
  createPartyWipeMessage,
  GameMessageType,
} from "../../../../packets/game-message.js";
import { DungeonExplorationController } from "../dungeon-exploration.js";
import { GlobalGameSessionStore } from "../../../services/global-auth-game-connection-session-store/index.js";
import { GameModePolicyStore } from "../../../../game-modes/game-mode-policy-store.js";
import { GameMode, GameModePolicy } from "../../../../game-modes/index.js";

export class GameServerGameLifecycleController implements GameLifecycleController {
  private readonly partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory;

  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly gameSessionStoreService: GameSessionStoreService,
    private readonly globalGameSessionStore: GlobalGameSessionStore,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly gameModePolicyStore: GameModePolicyStore,
    private readonly dungeonExplorationController: DungeonExplorationController
  ) {
    this.partyDelayedGameMessageFactory = new PartyDelayedGameMessageFactory(
      this.updateDispatchFactory
    );
  }

  async getOrInitializeGame(gameId: GameId) {
    const existingGame = this.gameRegistry.getGameOption(gameId);
    if (existingGame) {
      return existingGame;
    }
    const newGame = await this.initializeExpectedPendingGame(gameId);
    return newGame;
  }

  private async initializeExpectedPendingGame(gameId: GameId) {
    const pendingGameSetupOption = await this.gameSessionStoreService.getPendingGameSetup(gameId);
    if (pendingGameSetupOption === null) {
      throw new Error(
        "A user presented a token with a game id that didn't match any existing game or pending game setup."
      );
    }

    const deserializedGame = SpeedDungeonGame.fromSerialized(pendingGameSetupOption.game);
    deserializedGame.initializeBattlesOnDeserialization();
    for (const [_, party] of deserializedGame.adventuringParties) {
      party.combatantManager.updateHomePositions();
    }
    const newGame = deserializedGame;

    for (const [_, player] of newGame.players) {
      if (player.partyName !== null) {
        newGame.putPlayerInParty(player.partyName, player.username);
      }
    }

    this.gameRegistry.registerGame(newGame);

    await this.gameSessionStoreService.deletePendingGameSetup(newGame.id);
    await this.gameSessionStoreService.writeActiveGameStatus(
      newGame.id,
      new ActiveGameStatus(newGame.name, newGame.id)
    );

    return newGame;
  }

  async joinGameHandler(gameId: GameId, session: UserSession) {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    const game = this.gameRegistry.requireGame(gameId);

    session.joinGame(game);

    session.subscribeToChannel(game.getChannelName());

    const player = game.getExpectedPlayer(session.username);

    const partyName = player.getExpectedPartyName();

    const party = game.getExpectedParty(partyName);
    session.subscribeToChannel(getPartyChannelName(game.name, party.name));

    const battleOption = party.getBattleOption(game) || undefined;

    // if they are reconnecting their client would have lost the game information
    // could avoid sending it if this is a connection from the lobby though
    // for simplicity we'll eat the performance cost until it is measured
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameFullUpdate,
      data: {
        game: game.toSerialized(),
        awaitingUnresolvedReplayResolutionDuration: party.inputLock.remainingDuration || undefined,
        battle: battleOption
          ? {
              battle: battleOption.toSerialized(),
              combatantActionPoints: [...party.combatantManager.getAllCombatants()].map(
                ([combatantId, combatant]) => {
                  return {
                    combatantId,
                    actionPoints: combatant.getCombatantProperties().resources.getActionPoints(),
                  };
                }
              ),
            }
          : undefined,
      },
    });

    // clients should handle this differently than in the lobby
    // and just mark this player as connected in their client
    outbox.pushToChannel(
      game.getChannelName(),
      {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: session.username, joinOrder: player.joinOrder },
      },
      { excludedIds: [session.connectionId] }
    );

    const allPlayersAreConnectedToGame = this.allPlayersAreConnectedToGame(game);

    if (!game.clock.isLive() && allPlayersAreConnectedToGame) {
      const startGameOutbox = await this.startGame(game);
      outbox.pushFromOther(startGameOutbox);
    }

    game.inputLock.remove(session.taggedUserId.id);

    return outbox;
  }

  private async startGame(game: SpeedDungeonGame) {
    const gameModePolicy = this.gameModePolicyStore.getPolicy(game.mode);
    game.clock.startLiveSession();
    await gameModePolicy.persistence.onGameStart(game);
    await gameModePolicy.ladder.onGameStart(game);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.GameStarted,
      data: { firstStartedAt: game.clock.requireFirstStartedAt() },
    });

    if (!game.isContinuedRun) {
      const sessionsInGame = this.userSessionRegistry.getAllSessionsInGame(game);

      for (const session of sessionsInGame) {
        const toggleExploreOutbox =
          await this.dungeonExplorationController.toggleReadyToExploreHandler(session);
        outbox.pushFromOther(toggleExploreOutbox);
      }
    }

    return outbox;
  }

  private allPlayersAreConnectedToGame(game: SpeedDungeonGame) {
    let result = true;
    for (const [username, player] of Array.from(game.players)) {
      const sessionOption = this.userSessionRegistry.getSessionByUsername(username);
      if (!sessionOption) {
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
    const gameModePolicy = this.gameModePolicyStore.getPolicy(game.mode);

    const ladderPolicyOutbox = await gameModePolicy.ladder.onLiveGameLeave(game, party, player);
    outbox.pushFromOther(ladderPolicyOutbox);

    const persistencePolicyOutbox = await gameModePolicy.persistence.onLiveGameLeave(
      game,
      player,
      this
    );
    outbox.pushFromOther(persistencePolicyOutbox);

    const gameModesWhereLeavingRemovesPlayer = [
      GameMode.RankedRace,
      GameMode.UnrankedRace,
      GameMode.Progression,
    ];

    if (gameModesWhereLeavingRemovesPlayer.includes(game.mode)) {
      const removedPlayerOutbox = await this.handlePlayerRemovalOnGameLeave(
        session,
        game,
        party,
        gameModePolicy
      );
      outbox.pushFromOther(removedPlayerOutbox);
    }

    return outbox;
  }

  private async handlePlayerRemovalOnGameLeave(
    session: UserSession,
    game: SpeedDungeonGame,
    party: AdventuringParty,
    gameModePolicy: GameModePolicy
  ) {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
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

    const partyShouldBeMarkedWiped = this.partyShouldBeMarkedWiped(
      party,
      partyWasRemoved,
      deadPartyMembersAbandoned
    );

    if (partyShouldBeMarkedWiped) {
      const partyWipedOutbox = await this.handlePartyWipe(game, party, gameModePolicy);
      outbox.pushFromOther(partyWipedOutbox);
    }

    game.removePlayer(session.username);
    await this.globalGameSessionStore.clearSession(session.taggedUserId);

    const noPlayersRemain = game.players.size === 0;
    const allPartiesWiped = game.allPartiesWiped();

    // - if there are no living parties in the game, clean up the game
    if (allPartiesWiped || noPlayersRemain) {
      await this.cleanUpGame(game);
    }

    return outbox;
  }

  private partyShouldBeMarkedWiped(
    party: AdventuringParty,
    partyWasRemoved: boolean,
    deadPartyMembersAbandoned: boolean
  ) {
    const partyHasNotYetEscaped = !party.timeOfEscape; // if they already escaped they shouldn't be marked as wiped
    const partyHasNotYetWiped = party.timeOfWipe === null;
    const partyIsInWipableState =
      partyWasRemoved || (deadPartyMembersAbandoned && partyHasNotYetWiped);
    return partyHasNotYetEscaped && partyIsInWipableState;
  }

  private async handlePartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    policy: GameModePolicy
  ) {
    party.timeOfWipe = Date.now();
    await policy.persistence.onPartyWipe(game, party);
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    const ladderDeathMessagesOutbox = await policy.ladder.onPartyWipe(game, party);

    const remainingParties = Object.values(game.adventuringParties);
    if (remainingParties.length) {
      const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
      const partyWipedOutbox =
        this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
          game.getChannelName(),
          GameMessageType.PartyWipe,
          createPartyWipeMessage(party.name, floorNumber, new Date(Date.now())),
          getPartyChannelName(game.name, party.name)
        );
      outbox.pushFromOther(partyWipedOutbox);
    }

    if (ladderDeathMessagesOutbox) {
      outbox.pushFromOther(ladderDeathMessagesOutbox);
    }
    return outbox;
  }

  async cleanUpGame(game: SpeedDungeonGame) {
    const gameModePolicy = this.gameModePolicyStore.getPolicy(game.mode);
    await gameModePolicy.persistence.onLastPlayerLeftLiveGame(game);
    await gameModePolicy.ladder.onLastPlayerLeftLiveGame();

    this.gameRegistry.unregisterGame(game.id);
    // even though we clear their session on leave game, it is possible that they never joined the game,
    // the other users get bored and leave and the user that never joined would be stuck with a stale
    // session awaiting initial connection with no way to clear it, so we'll clean them all here in case of that
    // @ARCHITECTURE - I don't think it will race with a lobby game created by same name because we prohibit
    // creation of lobby game while active or pending game status of that name exists
    await this.globalGameSessionStore.clearSessionsInGame(game.id);
    await this.gameSessionStoreService.deleteActiveGameStatus(game.id);
    await this.gameSessionStoreService.deletePendingGameSetup(game.id);
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
        this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
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
