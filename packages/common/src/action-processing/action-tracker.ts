import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../combat/index.js";
import { Combatant } from "../combatants/index.js";
import { Milliseconds } from "../primatives/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { Vfx } from "../vfx/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import { ActionResolutionStep, ActionResolutionStepContext } from "./action-steps/index.js";
import { ACTION_STEP_CREATORS } from "./action-steps/step-creators.js";

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
    private idGenerator: IdGenerator,
    private spawnedEntityFromParent?: null | Combatant | Vfx
  ) {
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    this.spawnedEntityOption = spawnedEntityFromParent || null;

    const context: ActionResolutionStepContext = {
      combatantContext: this.parentActionManager.combatantContext,
      tracker: this,
      manager: this.parentActionManager,
      idGenerator,
    };

    const stepTypes = action.getResolutionSteps();
    const firstStepOption = stepTypes[0];
    if (firstStepOption === undefined) throw new Error("no action resolution step creators found");
    const stepCreator = ACTION_STEP_CREATORS[firstStepOption];

    this.currentStep = stepCreator(context);
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
