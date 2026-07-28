import { Milliseconds } from "@speed-dungeon/common";

// wall-clock times are shown in the reader's own locale and zone, unlike formatDuration, which is a
// length of time and the same number everywhere. only ever rendered after a query resolves in the
// browser, so there is no server-rendered string for it to disagree with
export function formatTimestamp(timestamp: Milliseconds): string {
  return new Date(timestamp).toLocaleString();
}
