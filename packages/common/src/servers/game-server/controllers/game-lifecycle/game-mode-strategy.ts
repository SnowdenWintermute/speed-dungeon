import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { EntityId } from "../../../../aliases.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../../game/player.js";
import { ClientSequentialEvent } from "../../../../packets/client-sequential-events.js";

export interface GameModeStrategy {
  onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void>;
  onGameStart(game: SpeedDungeonGame): Promise<void>;
  onGameLeave(
    game: SpeedDungeonGame,
    partyOption: undefined | AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<ClientSequentialEvent[]>;
  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<void>;
  onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<void>;
  onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<ClientSequentialEvent[]>;
  onPartyVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    characterLevelsBeforeChanges: Record<EntityId, number>
  ): Promise<ClientSequentialEvent[]>;
}
