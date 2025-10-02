import { GameUpdateCommand } from "@speed-dungeon/common";
import { ReplayTreeProcessor } from "./replay-tree-processor";

export class GameUpdateTracker<T extends GameUpdateCommand> {
  private isComplete: boolean = false;
  private shouldCompleteInSequence: boolean = false;
  constructor(public readonly command: T) {}

  getIsComplete() {
    return this.isComplete;
  }

  setAsQueuedToComplete() {
    this.shouldCompleteInSequence = true;
  }

  tryToCompleteInSequence(parentReplayTreeProcessor: ReplayTreeProcessor) {
    if (!this.shouldCompleteInSequence) {
      console.log("not ready to complete in sequence");
      return;
    }

    console.log(
      "trying to complete in sequence, completionOrderId:",
      this.command.completionOrderId,
      "next expected id:",
      parentReplayTreeProcessor.getNextNodeCompletionId(),
      parentReplayTreeProcessor.sequenceId
    );

    const nextExpectedCompletionOrderId = parentReplayTreeProcessor.getNextNodeCompletionId();

    if (this.command.completionOrderId === nextExpectedCompletionOrderId) {
      this.isComplete = true;
      parentReplayTreeProcessor.incrementNextExpectedCompletedNodeIdIndex();
    } else {
      console.error("tried to complete a game update out of order");
    }
  }
}
