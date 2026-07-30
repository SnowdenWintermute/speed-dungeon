import { ConnectionId } from "../aliases.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { GameServerGameLifecycleController } from "../servers/game-server/controllers/game-lifecycle/index.js";
import { SpeedDungeonProfileService } from "../servers/services/profiles.js";
import { UserGameDataPersistenceService } from "../servers/services/user-game-data-persistence/index.js";
import { UserSessionRegistry } from "../servers/sessions/user-session-registry.js";
import { UserSession } from "../servers/sessions/user-session.js";
import { MessageDispatchFactory } from "../servers/update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../servers/update-delivery/outbox.js";
import { CombatantWithPets } from "../types.js";

// what a persistence policy is allowed to reach. all four modes' policies take the same set, so it
// is assembled once and handed over whole
export interface PersistencePolicyDependencies {
  userSessionRegistry: UserSessionRegistry;
  profileService: SpeedDungeonProfileService;
  userGameDataPersistenceService: UserGameDataPersistenceService;
  messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>;
}

/** what to save and how to save it when certain events happen */
export abstract class GameModePersistencePolicy {
  protected readonly userSessionRegistry: UserSessionRegistry;
  protected readonly profileService: SpeedDungeonProfileService;
  protected readonly userGameDataPersistenceService: UserGameDataPersistenceService;
  protected readonly messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>;

  constructor(dependencies: PersistencePolicyDependencies) {
    this.userSessionRegistry = dependencies.userSessionRegistry;
    this.profileService = dependencies.profileService;
    this.userGameDataPersistenceService = dependencies.userGameDataPersistenceService;
    this.messageDispatchFactory = dependencies.messageDispatchFactory;
  }

  async onCreateCharacterInLobbySetup(
    _session: UserSession,
    _game: SpeedDungeonGame,
    _character: CombatantWithPets
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    return new MessageDispatchOutbox(this.messageDispatchFactory);
  }
  abstract onGameStart(game: SpeedDungeonGame): Promise<void>;
  abstract onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void>;
  abstract onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void>;
  async onLiveGameLeave(
    _game: SpeedDungeonGame,
    _player: SpeedDungeonPlayer,
    _gameLifecycleController: GameServerGameLifecycleController,
    _leavingConnectionId: ConnectionId
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    return new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
  }
  onLastPlayerLeftLiveGame(_game: SpeedDungeonGame): Promise<void> {
    return Promise.resolve();
  }
  onPartyEscape(_game: SpeedDungeonGame, _party: AdventuringParty): Promise<void> {
    return Promise.resolve();
  }
  onPartyWipe(_game: SpeedDungeonGame, _party: AdventuringParty): Promise<void> {
    return Promise.resolve();
  }
  onPartyBattleVictory(_game: SpeedDungeonGame, _party: AdventuringParty): Promise<void> {
    return Promise.resolve();
  }
}
