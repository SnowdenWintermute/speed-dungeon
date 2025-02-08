import { ReplayTreeManager } from "@/app/3d-world/game-world/replay-tree-manager";
import { NestedNodeReplayEvent, ReplayEventNode, Replayer } from "@speed-dungeon/common";

export function newActionReplayTreeHandler(eventData: { replayTree: NestedNodeReplayEvent }) {
  Replayer.printReplayTree(eventData.replayTree);

  const replayManager = new ReplayTreeManager(eventData.replayTree);
  replayManager.startProcessing();
}

// walk the tree until first gameUpdateCommand
// start a gameUpdateCommand execution tracker
