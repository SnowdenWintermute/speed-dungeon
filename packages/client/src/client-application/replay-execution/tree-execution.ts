import {
  ERROR_MESSAGES,
  LOOP_SAFETY_ITERATION_LIMIT,
  NestedNodeReplayEvent,
  ReplayEventType,
  invariant,
} from "@speed-dungeon/common";
import { ReplayBranchExecution } from "./branch-execution";
import { ClientApplication } from "..";

//   - process each active BranchExecution until none can be completed
export class ReplayTreeExecution {
  private activeBranches: ReplayBranchExecution[] = [];
  private nextExpectedCompletionOrderIdListIndex: number = 0;
  private expectedCompletionOrderIds: number[];

  constructor(
    readonly clientApplication: ClientApplication,
    root: NestedNodeReplayEvent,
    public onComplete: () => void
  ) {
    this.expectedCompletionOrderIds = this.collectCompletionOrderIds(root);
    this.activeBranches.push(new ReplayBranchExecution(this, root, this.activeBranches));
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

  processBranches(deltaTime: number) {
    // iterate backwards so we can splice out branches without affecting the iteration
    for (let i = this.activeBranches.length - 1; i >= 0; i--) {
      const branch = this.activeBranches[i];
      invariant(branch !== undefined, "checked above");

      if (branch.isDoneProcessing()) {
        this.activeBranches.splice(i, 1);
      }

      branch.processAllCompletableSteps();
    }
  }

  private collectCompletionOrderIds(root: NestedNodeReplayEvent): number[] {
    const ids: number[] = [];
    for (const event of root.events) {
      if (event.type === ReplayEventType.GameUpdate) {
        const { completionOrderId } = event.gameUpdate;
        if (completionOrderId === null) {
          throw new Error("expected to only receive completed game update commands");
        }

        ids.push(completionOrderId);
      } else {
        const childIds = this.collectCompletionOrderIds(event);
        ids.push(...childIds);
      }
    }
    return ids.sort((a, b) => a - b);
  }
}
