import { NormalizedPercentage, Username } from "../../aliases.js";
import { CharacterControlScheme } from "../../game-modes/index.js";

export interface WinRateLadderQuery {
  page: number;
  minimumGamesPlayed: number;
  controlSchemeOption?: CharacterControlScheme;
}

export interface WinLossRecord {
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: NormalizedPercentage;
}

export interface WinRateLadderView {
  rank: number;
  username: Username;
  record: WinLossRecord;
}
