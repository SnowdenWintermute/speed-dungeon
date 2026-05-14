import { AdventuringParty } from "../adventuring-party/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";

/** what to save and how to save it when certain events happen
 * will need access to persistence services, or be owned by a composing class that
 * can pass the services to each method
 * */
export interface GameModePersistencePolicy {
  onGameStart(): Promise<void>;
  onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void>;
  onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void>;
  onGameLeave(game: SpeedDungeonGame, player: SpeedDungeonPlayer): Promise<void>;
  onLastPlayerLeftGame(): Promise<void>;
  onPartyEscape(): Promise<void>;
  onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void>;
  onPartyVictory(): Promise<void>;
}
