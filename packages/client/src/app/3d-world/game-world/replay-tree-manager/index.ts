import {
  GameUpdateCommand,
  GameUpdateCommandType,
  NestedNodeReplayEvent,
  ReplayEventNode,
  ReplayEventType,
} from "@speed-dungeon/common";

export class ReplayTreeManager {
  activeBranches: ReplayBranchProcessor[] = [];

  constructor(private root: NestedNodeReplayEvent) {}

  getIsProcessing() {
    //
  }

  startProcessing() {
    // root.events
  }

  isComplete() {}
}

export class ReplayBranchProcessor {
  private currentIndex = -1;
  private isComplete = false;
  private currentGameUpdateOption: null | { update: GameUpdateCommand; isComplete: boolean } = null;
  constructor(
    private node: NestedNodeReplayEvent,
    private branchProcessors: ReplayBranchProcessor[]
  ) {}

  currentStepIsComplete() {}
  isDoneProcessing() {
    return this.isComplete;
  }
  startProcessingNext() {
    this.currentIndex += 1;
    const node = this.node.events[this.currentIndex];
    if (node === undefined) return (this.isComplete = true);
    if (node.type === ReplayEventType.NestedNode) {
      const newBranch = new ReplayBranchProcessor(node, this.branchProcessors);
      newBranch.startProcessingNext();
      this.branchProcessors.push(newBranch);
      return;
    }

    this.currentGameUpdateOption = { update: node.gameUpdate, isComplete: false };
  }
}
