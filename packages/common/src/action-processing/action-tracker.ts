import {
  COMBAT_ACTIONS,
  CombatActionAnimationPhase,
  CombatActionExecutionIntent,
  CombatActionHitOutcomes,
} from "../combat/index.js";
import { CombatantCondition } from "../combatants/index.js";
import { Milliseconds } from "../primatives/index.js";
import { SpawnableEntity } from "../spawnables/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import { ActionResolutionStep, ActionResolutionStepContext } from "./action-steps/index.js";
import { ACTION_STEP_CREATORS } from "./action-steps/step-creators.js";
import { EntityAnimation } from "./game-update-commands.js";

export class ActionTracker {
  currentStep: ActionResolutionStep;
  stepIndex: number = -1;
  completedSteps: ActionResolutionStep[] = [];
  wasInterrupted: boolean = false;
  spawnedEntityOption: null | SpawnableEntity = null;
  // initiatedByTriggeredCondition: null | CombatantCondition = null;
  hitOutcomes = new CombatActionHitOutcomes();
  actionAnimations: Partial<Record<CombatActionAnimationPhase, EntityAnimation | null>> | null =
    null;

  constructor(
    public parentActionManager: ActionSequenceManager,
    public id: string,
    public readonly actionExecutionIntent: CombatActionExecutionIntent,
    private previousTrackerInSequenceOption: null | ActionTracker,
    private timeStarted: Milliseconds,
    private idGenerator: IdGenerator,
    private spawnedEntityFromParent?: null | SpawnableEntity
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
