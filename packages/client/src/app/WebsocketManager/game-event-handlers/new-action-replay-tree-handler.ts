import { ReplayEventNode, Replayer } from "@speed-dungeon/common";

export function newActionReplayTreeHandler(eventData: { replayTree: ReplayEventNode }) {
  Replayer.printReplayTree(eventData.replayTree);
}
