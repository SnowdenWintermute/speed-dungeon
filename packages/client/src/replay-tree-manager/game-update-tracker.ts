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

  /** Replay events have a completionOrderId. In the interest of making sure we start the next
   * event in the correct sequenece as defined on the server, when the client has finished playing
   * back the replay event, mark it as ready to be completed. We'll mark it as truly completed
   * in the game loop if it is the next expected completionOrderId to complete. */
  setAsQueuedToComplete() {
    this.shouldCompleteInSequence = true;
  }

  getActionNameAndStep() {
    return {
      actionName: COMBAT_ACTION_NAME_STRINGS[this.command.actionName],
      step: ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.command.step],
    };
  }

  /** Check if next in line to complete */
  tryToCompleteInSequence(parentReplayTreeProcessor: ReplayTreeProcessor) {
    if (!this.shouldCompleteInSequence) {
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
