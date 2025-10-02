import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  COMBAT_ACTION_NAME_STRINGS,
  GameUpdateCommand,
} from "@speed-dungeon/common";
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

  getActionNameAndStep() {
    return {
      actionName: COMBAT_ACTION_NAME_STRINGS[this.command.actionName],
      step: ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.command.step],
    };
  }

  tryToCompleteInSequence(parentReplayTreeProcessor: ReplayTreeProcessor) {
    if (!this.shouldCompleteInSequence) {
      console.log("not ready to complete in sequence");
      return;
    }

    const nextExpectedCompletionOrderId = parentReplayTreeProcessor.getNextNodeCompletionId();

    if (this.command.completionOrderId === nextExpectedCompletionOrderId) {
      if (this.isComplete === false) {
        parentReplayTreeProcessor.incrementNextExpectedCompletedNodeIdIndex();
      }
      this.isComplete = true;
    } else {
      // sometimes things complete out of order. I assume this is due to
      // the fact that there are race conditions in translation and animation events
      // in the game updates. That is why we have the completionOrderId system to begin with
      // console.info("tried to complete a game update out of order", this.getActionNameAndStep());
    }
  }
}
