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

/** what to save and how to save it when certain events happen
 * will need access to persistence services, or be owned by a composing class that
 * can pass the services to each method
 * */
export abstract class GameModePersistencePolicy {
  constructor(
    protected userSessionRegistry: UserSessionRegistry,
    protected profileService: SpeedDungeonProfileService,
    protected userGameDataPersistenceService: UserGameDataPersistenceService,
    protected messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

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
    _gameLifecycleController: GameServerGameLifecycleController
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
