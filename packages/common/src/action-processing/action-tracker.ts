import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../combat/index.js";
import { Combatant } from "../combatants/index.js";
import { Milliseconds } from "../primatives/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { Vfx } from "../vfx/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import { ActionResolutionStep } from "./action-steps/index.js";

export class ActionTracker {
  currentStep: ActionResolutionStep;
  completedSteps: ActionResolutionStep[] = [];
  wasInterrupted: boolean = false;
  spawnedEntityOption: null | Combatant | Vfx = null;
  constructor(
    public parentActionManager: ActionSequenceManager,
    public id: string,
    public readonly actionExecutionIntent: CombatActionExecutionIntent,
    private previousTrackerInSequenceOption: null | ActionTracker,
    private timeStarted: Milliseconds,
    idGenerator: IdGenerator
  ) {
    // in the case of sub-actions, we'll start with spawning the projectiles or vfx
    // otherwise start with the combatant moving
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    const stepCreatorsResult = action.getResolutionSteps(
      this.parentActionManager.combatantContext,
      this.actionExecutionIntent,
      this,
      this.previousTrackerInSequenceOption,
      this.parentActionManager,
      idGenerator
    );
    if (stepCreatorsResult instanceof Error) throw stepCreatorsResult;
    const firstStepCreatorOption = stepCreatorsResult[0];
    if (!firstStepCreatorOption) throw new Error("no action resolution step creators found");

    this.currentStep = firstStepCreatorOption();
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
