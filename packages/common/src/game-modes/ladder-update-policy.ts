import { AdventuringParty } from "../adventuring-party/index.js";
import { EntityId } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { ClientSequentialEvent } from "../packets/client-sequential-events.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../servers/update-delivery/outbox.js";

/** how to update which ladder when certain events happen
 * will need access to ladder services, or be owned by a composing class that
 * can pass the services to each method
 * */
export interface GameModeLadderUpdatePolicy {
  onFloorDescent(): Promise<void>;
  onGameStart(): Promise<void>;
  onBattleResult(): Promise<void>;
  onGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<ClientSequentialEvent[]>;
  onLastPlayerLeftGame(): Promise<void>;
  onPartyEscape(): Promise<void>;
  onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate>>;
  onPartyVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<MessageDispatchOutbox<GameStateUpdate>>;
}
