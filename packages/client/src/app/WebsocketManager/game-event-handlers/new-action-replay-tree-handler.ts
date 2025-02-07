import { ReplayEventNode, Replayer } from "@speed-dungeon/common";

export function newActionReplayTreeHandler(eventData: { replayTree: ReplayEventNode }) {
  Replayer.printReplayTree(eventData.replayTree);

  // lock input
  // get the root node and follow it until an update to execute appears
  // register any branches
  //
  // on each game tick
  // tick each game update command
  // check if command completed
  // fetch next command in the node
  // register any new branches
  // if execution registry is empty, mark as ready to receieve next packet
}

// walk the tree until first gameUpdateCommand
// start a gameUpdateCommand execution tracker
