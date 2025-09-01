import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";

export class ActionStepConfigUtils {
  /** Actions should sometimes animate faster and thus not require walking forward to use */
  static removeMoveForwardSteps(stepsConfig: ActionResolutionStepsConfig) {
    const initialPositioning = stepsConfig.steps[ActionResolutionStepType.InitialPositioning];
    delete initialPositioning?.getDestination;
    delete initialPositioning?.getAnimation;

    delete stepsConfig.steps[ActionResolutionStepType.FinalPositioning]?.getAnimation;
    stepsConfig.steps[ActionResolutionStepType.FinalPositioning]!.shouldIdleOnComplete = true;
  }
}
