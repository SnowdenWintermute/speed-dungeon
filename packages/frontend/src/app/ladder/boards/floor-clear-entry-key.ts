import { RankedFloorClearView } from "@speed-dungeon/common";

// both floor clear boards list the same row type, ranked differently
export function floorClearEntryKey(entry: RankedFloorClearView): string {
  return entry.id;
}
