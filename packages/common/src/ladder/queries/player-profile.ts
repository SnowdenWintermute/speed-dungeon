import { Username } from "../../aliases.js";
import { FloorClearView } from "./floor-clear-times.js";
import { WinLossRecord } from "./win-rate-ladder.js";

export interface PlayerProfileView {
  username: Username;
  rankedRaceRecord: WinLossRecord;
  // the same clears ranked by two different clocks — see PlayerProfileData
  personalBestFloorTimes: FloorClearView[];
  personalBestCumulativeTimes: FloorClearView[];
}

export enum PlayerProfileLookupType {
  Found,
  NoSuchPlayer,
}

// NoSuchPlayer is "that username belongs to nobody" — a player who exists but has never played is
// Found with an empty profile
export type PlayerProfileLookup =
  | { type: PlayerProfileLookupType.Found; profile: PlayerProfileView }
  | { type: PlayerProfileLookupType.NoSuchPlayer };
