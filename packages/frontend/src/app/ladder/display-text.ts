import { Milliseconds } from "@speed-dungeon/common";
import { formatTimestamp } from "@/utils/format-timestamp";

// a value a record legitimately does not have, written the same way wherever one is displayed. an
// absent support class, a party still playing, a character no longer on the ladder: the cell says so
// rather than sitting empty, which would read as a figure we failed to load
export const NO_VALUE_TEXT = "—";

export function optionalTimestampText(timestampOption: Milliseconds | undefined): string {
  if (timestampOption === undefined) {
    return NO_VALUE_TEXT;
  }
  return formatTimestamp(timestampOption);
}
