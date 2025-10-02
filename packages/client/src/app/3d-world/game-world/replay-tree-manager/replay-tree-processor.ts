import {
  ERROR_MESSAGES,
  LOOP_SAFETY_ITERATION_LIMIT,
  NestedNodeReplayEvent,
  ReplayEventType,
  SequentialIdGenerator,
} from "@speed-dungeon/common";
import { ReplayBranchProcessor } from "./replay-branch-processor";

export class ReplayTreeProcessor {
  static sequentialIdGenerator = new SequentialIdGenerator();
  sequenceId: number;

  activeBranches: ReplayBranchProcessor[] = [];
  private nextExpectedCompletionOrderIdListIndex: number = 0;
  private expectedCompletionOrderIds: number[];

  constructor(
    root: NestedNodeReplayEvent,
    public onComplete: () => void
  ) {
    this.sequenceId = ReplayTreeProcessor.sequentialIdGenerator.getNextIdNumeric();

    this.expectedCompletionOrderIds = this.collectCompletionOrderIds(root);

    this.activeBranches.push(new ReplayBranchProcessor(this, root, this.activeBranches));
  }

  getActiveBranches() {
    return this.activeBranches;
  }

  isComplete() {
    return !this.activeBranches.length;
  }

  getNextNodeCompletionId() {
    return this.expectedCompletionOrderIds[this.nextExpectedCompletionOrderIdListIndex];
  }

  incrementNextExpectedCompletedNodeIdIndex() {
    this.nextExpectedCompletionOrderIdListIndex += 1;
  }

  collectCompletionOrderIds(root: NestedNodeReplayEvent): number[] {
    const ids: number[] = [];
    for (const event of root.events) {
      if (event.type === ReplayEventType.GameUpdate) {
        const { completionOrderId } = event.gameUpdate;
        if (completionOrderId === null)
          throw new Error("expected to only receive completed game update commands");

        ids.push(completionOrderId);
      } else {
        const childIds = this.collectCompletionOrderIds(event);
        ids.push(...childIds);
      }
    }
    return ids.sort((a, b) => a - b);
  }

  processBranches() {
    // iterate backwards so we can splice out branches without affecting the iteration
    for (let i = this.activeBranches.length - 1; i >= 0; i--) {
      const branch = this.activeBranches[i];
      if (!branch) continue;
      if (branch.isDoneProcessing()) this.activeBranches.splice(i, 1);
      let branchIsComplete = branch.isDoneProcessing();

      const currentUpdateTrackerOption = branch.getCurrentGameUpdate();
      if (currentUpdateTrackerOption && !currentUpdateTrackerOption.getIsComplete()) {
        currentUpdateTrackerOption.tryToCompleteInSequence(this);
      }

      let currentStepComplete = branch.currentStepIsComplete();

      let safetyCounter = -1;
      while (currentStepComplete && !branchIsComplete) {
        safetyCounter += 1;
        if (safetyCounter > LOOP_SAFETY_ITERATION_LIMIT) {
          console.error(
            ERROR_MESSAGES.LOOP_SAFETY_ITERATION_LIMIT_REACHED(LOOP_SAFETY_ITERATION_LIMIT),
            "in replay tree manager"
          );
        }

        branch.startProcessingNext();

        const currentUpdateTracker = branch.getCurrentGameUpdate();
        if (currentUpdateTracker === null) break;

        if (currentUpdateTracker && !currentUpdateTracker.getIsComplete()) {
          currentUpdateTracker.tryToCompleteInSequence(this);
        }

        currentStepComplete = branch.currentStepIsComplete();
        branchIsComplete = branch.isDoneProcessing();
      }
    }
  }
}
