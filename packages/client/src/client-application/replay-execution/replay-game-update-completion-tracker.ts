import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  AnimationTimingType,
  COMBAT_ACTION_NAME_STRINGS,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { ReplayTreeExecution } from "./tree-execution";

export class ReplayGameUpdateTracker<T extends GameUpdateCommand> {
  private isComplete: boolean = false;
  private shouldCompleteInSequence: boolean = false;
  private timeStarted = Date.now();
  constructor(public readonly command: T) {}

  getIsComplete() {
    const elapsed = Date.now() - this.timeStarted;
    switch (this.command.type) {
      case GameUpdateCommandType.SpawnEntities:
      case GameUpdateCommandType.ResourcesPaid:
      case GameUpdateCommandType.ActionUseGameLogMessage:
      case GameUpdateCommandType.ActionResolutionGameLogMessage:
      case GameUpdateCommandType.ActivatedTriggers:
      case GameUpdateCommandType.HitOutcomes:
      case GameUpdateCommandType.ActionCompletion:
        return true;
      case GameUpdateCommandType.ActionEntityMotion:
      case GameUpdateCommandType.CombatantMotion: {
        let duration = 0;
        const { mainEntityUpdate } = this.command;
        if (mainEntityUpdate.translationOption?.duration) {
          duration = mainEntityUpdate.translationOption?.duration;
        }
        const animationOption = mainEntityUpdate.animationOption;
        if (animationOption && animationOption.timing.type === AnimationTimingType.Timed) {
          if (animationOption.timing.duration > duration) {
            duration = animationOption.timing.duration;
          }
        }
        return elapsed >= duration;
      }
    }
    // return this.isComplete;
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
  tryToCompleteInSequence(parentReplayTreeProcessor: ReplayTreeExecution) {
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
