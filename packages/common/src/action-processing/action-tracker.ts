import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../combat/index.js";
import { Combatant } from "../combatants/index.js";
import { Milliseconds } from "../primatives/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { Vfx } from "../vfx/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
} from "./action-steps/index.js";
import { ACTION_STEP_CREATORS } from "./action-steps/step-creators.js";

export class ActionTracker {
  currentStep: ActionResolutionStep;
  stepIndex: number = -1;
  completedSteps: ActionResolutionStep[] = [];
  wasInterrupted: boolean = false;
  spawnedEntityOption: null | Combatant | Vfx = null;
  constructor(
    public parentActionManager: ActionSequenceManager,
    public id: string,
    public readonly actionExecutionIntent: CombatActionExecutionIntent,
    private previousTrackerInSequenceOption: null | ActionTracker,
    private timeStarted: Milliseconds,
    private idGenerator: IdGenerator,
    private spawnedEntityFromParent?: null | Combatant | Vfx
  ) {
    if (spawnedEntityFromParent) this.spawnedEntityOption = spawnedEntityFromParent;
    const firstStepOption = this.initializeNextStep();
    if (firstStepOption === null) throw new Error("expected first action step missing");
    this.currentStep = firstStepOption;
  }

  initializeNextStep() {
    this.stepIndex += 1;
    const action = COMBAT_ACTIONS[this.actionExecutionIntent.actionName];
    const context: ActionResolutionStepContext = {
      combatantContext: this.parentActionManager.combatantContext,
      tracker: this,
      manager: this.parentActionManager,
      idGenerator: this.idGenerator,
    };
    const stepTypes = action.getResolutionSteps();
    const stepOption = stepTypes[this.stepIndex];
    if (stepOption === undefined) return null;
    const stepCreator = ACTION_STEP_CREATORS[stepOption];
    const newStep = stepCreator(context);
    this.currentStep = newStep;
    console.log(
      "initialized next step index",
      this.stepIndex,
      ACTION_RESOLUTION_STEP_TYPE_STRINGS[newStep.type]
    );
    return newStep;
  }

  getPreviousTrackerInSequenceOption() {
    return this.previousTrackerInSequenceOption;
  }

  storeCompletedStep() {
    if (this.currentStep) this.completedSteps.push(this.currentStep);
  }
  getCompletedSteps() {
    return this.completedSteps;
  }
}
