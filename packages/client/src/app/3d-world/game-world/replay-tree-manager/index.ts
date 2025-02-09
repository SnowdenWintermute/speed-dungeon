import { GameUpdateCommand, NestedNodeReplayEvent, ReplayEventType } from "@speed-dungeon/common";
import { GAME_UPDATE_COMMAND_HANDLERS } from "./game-update-command-handlers";

export class ReplayTreeManager {
  private queue: NestedNodeReplayEvent[] = [];
  private current: null | ReplayTreeProcessor = null;
  constructor() {}

  enqueueTree(tree: NestedNodeReplayEvent) {
    this.queue.push(tree);
  }

  currentTreeCompleted() {
    return this.current === null || this.current.isComplete();
  }

  startNext() {
    const nextOption = this.queue.shift();
    this.current = nextOption ? new ReplayTreeProcessor(nextOption) : null;
  }

  processCurrent() {
    if (this.current) this.current.processBranches();
    if (this.currentTreeCompleted()) {
      this.current = null;
      this.startNext();
    }
  }
}

export class ReplayTreeProcessor {
  activeBranches: ReplayBranchProcessor[] = [];

  constructor(private root: NestedNodeReplayEvent) {
    this.activeBranches.push(new ReplayBranchProcessor(root, this.activeBranches));
  }

  getIsProcessing() {
    //
  }

  isComplete() {
    return !this.activeBranches.length;
  }

  processBranches() {
    // iterate backwards so we can splice out branches without affecting the iteration
    for (let i = this.activeBranches.length - 1; i >= 0; i--) {
      const branch = this.activeBranches[i];
      if (!branch) continue;
      if (branch.isDoneProcessing()) this.activeBranches.splice(i, 1);
      if (branch.currentStepIsComplete()) branch.startProcessingNext();
    }
  }
}

export interface GameUpdate {
  command: GameUpdateCommand;
  isComplete: boolean;
}

export class ReplayBranchProcessor {
  private currentIndex = -1;
  private isComplete = false;
  private currentGameUpdateOption: null | GameUpdate = null;
  constructor(
    private node: NestedNodeReplayEvent,
    private branchProcessors: ReplayBranchProcessor[]
  ) {}

  currentStepIsComplete(): boolean {
    if (this.currentGameUpdateOption === null) return true;
    else return this.currentGameUpdateOption.isComplete;
  }
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

    this.currentGameUpdateOption = { command: node.gameUpdate, isComplete: false };

    GAME_UPDATE_COMMAND_HANDLERS[node.gameUpdate.type](this.currentGameUpdateOption);
  }
}
