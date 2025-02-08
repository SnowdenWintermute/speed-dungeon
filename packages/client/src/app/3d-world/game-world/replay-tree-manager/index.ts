import { GameUpdateCommand, NestedNodeReplayEvent, ReplayEventType } from "@speed-dungeon/common";
import { GAME_UPDATE_COMMAND_HANDLERS } from "./game-update-command-handlers";

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

  unregisterBranch() {}

  processBranches() {
    for (const branch of this.activeBranches) {
      if (branch.isDoneProcessing()) this.unregisterBranch();
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
