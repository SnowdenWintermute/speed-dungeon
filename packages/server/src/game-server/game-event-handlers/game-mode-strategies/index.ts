import { AdventuringParty, SpeedDungeonGame, SpeedDungeonPlayer } from "@speed-dungeon/common";

export interface GameModeStrategy {
  onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void>;
  onGameStart(game: SpeedDungeonGame): Promise<Error | void>;
  onGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<Error | void>;
  onPartyLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<void | Error>;
  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<Error | void>;
  onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void>;
  onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void>;
  onPartyVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    characterLevelsBeforeChanges: { [id: string]: number }
  ): Promise<Error | void>;
}

// on game start
// - create the game record, party records and character records with initial values
//
// on player disconnect / game leave
// - update their character record's levels
// - if they were last one alive in their party to leave
//     - update their entire party's character records
//     - if at least 1 other party
//       - notify other parties of their defeat
//       - if there is only one other party, set that party as victors
//
// on party wipe
// - update entire party's character records
// - if at least 1 other party
//   - notify other parties of their defeat
//   - if there is only one other party and game not already completed, set that party as victors
//
// on party escape
// - update entire party's character records
// - set that party as victors
// - mark the game record as completed
// - if at least 1 other party
//   - notify other parties of their escape
