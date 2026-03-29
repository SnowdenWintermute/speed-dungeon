import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  AnimationTimingType,
  COMBAT_ACTION_NAME_STRINGS,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { ReplayTreeExecution } from "./tree-execution";
import { ClientApplication } from "..";

export class ReplayGameUpdateTracker<T extends GameUpdateCommand> {
  private _isComplete: boolean = false;
  private timeStarted = Date.now();
  constructor(public readonly command: T) {}

  /** Replay events have a completionOrderId. In the interest of making sure we start the next
   * event in the correct sequenece as defined on the server, when the client has finished playing
   * back the replay event, mark it as ready to be completed. We'll mark it as truly completed
   * in the game loop if it is the next expected completionOrderId to complete. */
  get shouldCompleteInSequence() {
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
        if (mainEntityUpdate.delayOption && mainEntityUpdate.delayOption > duration) {
          duration = mainEntityUpdate.delayOption;
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
  }

  get isComplete() {
    return this._isComplete;
  }

  onComplete(clientApplication: ClientApplication) {
    if (this.command.type === GameUpdateCommandType.ActionEntityMotion) {
      if (this.command.mainEntityUpdate.despawnOnCompleteMode !== undefined) {
        const partyResult = clientApplication.gameContext.requireParty();
        partyResult.actionEntityManager.unregisterActionEntity(
          this.command.mainEntityUpdate.entityId
        );
      }
    }
  }

  getActionNameAndStep() {
    return {
      actionName: COMBAT_ACTION_NAME_STRINGS[this.command.actionName],
      step: ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.command.step],
    };
  }

  /** Check if next in line to complete */
  tryToCompleteInSequence(parentReplayTreeProcessor: ReplayTreeExecution) {
    const nextExpectedCompletionOrderId = parentReplayTreeProcessor.getNextNodeCompletionId();

    if (this.command.completionOrderId === nextExpectedCompletionOrderId) {
      if (this.isComplete === false) {
        parentReplayTreeProcessor.incrementNextExpectedCompletedNodeIdIndex();
      }
      this._isComplete = true;

      this.onComplete(parentReplayTreeProcessor.clientApplication);
    } else {
      // sometimes things complete out of order. I assume this is due to
      // the fact that there are race conditions in translation and animation events
      // in the game updates. That is why we have the completionOrderId system to begin with
      // console.info("tried to complete a game update out of order", this.getActionNameAndStep());
    }
  }
}
