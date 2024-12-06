import { AdventuringParty, SpeedDungeonGame, SpeedDungeonPlayer } from "@speed-dungeon/common";

export interface GameModeStrategy {
  onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void>;
  onGameStart(game: SpeedDungeonGame): Promise<Error | void>;
  onGameLeave(
    game: SpeedDungeonGame,
    partyOption: undefined | AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<Error | void>;
  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<Error | void>;
  onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void>;
  onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void>;
  onPartyVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    characterLevelsBeforeChanges: { [id: string]: number }
  ): Promise<Error | void>;
}
