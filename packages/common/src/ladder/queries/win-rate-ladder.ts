import { Username } from "../../aliases.js";
import { CharacterControlScheme } from "../../game-modes/index.js";

// minimumGamesPlayed guards against a single-win player sitting at 100% forever
export interface WinRateLadderQuery {
  page: number;
  minimumGamesPlayed: number;
  controlSchemeOption?: CharacterControlScheme;
}

export interface WinLossRecord {
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number; // 0..1
}

export interface WinRateLadderView {
  rank: number;
  username: Username;
  record: WinLossRecord;
}
