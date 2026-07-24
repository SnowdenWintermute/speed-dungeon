import { Username } from "../../aliases.js";
import { FloorClearView } from "./floor-clear-times.js";
import { WinLossRecord } from "./win-rate-ladder.js";

// personal bests reuse FloorClearView — no separate shape
export interface PlayerProfileView {
  username: Username;
  rankedRaceRecord: WinLossRecord;
  personalBestFloorClears: FloorClearView[];
}
