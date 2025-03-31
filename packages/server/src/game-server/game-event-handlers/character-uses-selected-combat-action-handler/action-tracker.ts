import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  COMBAT_ACTIONS,
  CombatActionAnimationPhase,
  CombatActionExecutionIntent,
  CombatActionHitOutcomes,
  EntityAnimation,
  IdGenerator,
  Milliseconds,
  SpawnableEntity,
} from "@speed-dungeon/common";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import { ACTION_STEP_CREATORS } from "./action-step-creators.js";

export class ActionTracker {
  currentStep: ActionResolutionStep;
  stepIndex: number = -1;
  completedSteps: ActionResolutionStep[] = [];
  wasInterrupted: boolean = false;
  spawnedEntityOption: null | SpawnableEntity = null;
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
