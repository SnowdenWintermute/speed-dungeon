import { GameId, GameName, Milliseconds, Username } from "../../aliases.js";
import { DateRange } from "../../primatives/date-range.js";
import { PartyFate } from "../records/index.js";

// public, like every other ladder query: a player's history is part of their profile
export interface UserGameHistoryQuery {
  username: Username;
  page: number;
  dateRangeOption?: DateRange;
}

// a row in a player's paginated game-history list. the fate and the abandonment are that player's
// own, not the viewer's
export interface UserGameHistoryEntry {
  gameId: GameId;
  gameName: GameName;
  date: Milliseconds;
  partyFateOption?: PartyFate;
  abandonedAtOption?: Milliseconds;
}
