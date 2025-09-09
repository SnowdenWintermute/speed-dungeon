import { MeleeAttackAnimationType } from "../combat/combat-actions/action-implementations/attack/determine-melee-attack-animation-type.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionHitOutcomes,
} from "../combat/index.js";
import { HitOutcome } from "../hit-outcome.js";
import { Consumable } from "../items/consumables/index.js";
import { Milliseconds } from "../primatives/index.js";
import { SpawnableEntity, SpawnableEntityType } from "../spawnables/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./action-steps/index.js";
import { ACTION_STEP_CREATORS } from "./action-steps/step-creators.js";

export class ActionTracker {
  currentStep: ActionResolutionStep;
  stepIndex: number = -1;
  completedSteps: ActionResolutionStep[] = [];
  spawnedEntityOption: null | SpawnableEntity = null;
  // initiatedByTriggeredCondition: null | CombatantCondition = null;
  hitOutcomes = new CombatActionHitOutcomes();
  meleeAttackAnimationType: MeleeAttackAnimationType | null = null;
  consumableUsed: null | Consumable = null;
  /** Set by checking shouldExecute in DetermineShouldExecuteOrReleaseInputLock step */
  public wasAborted = false;
  /** Idea here is to have final steps such as DetermineEnvironmentalHazardTriggers,
   * DetermineEndTurnAndReleaseInputLock, RecoveryMotion conditionally queue themselves only once*/
  public hasQueuedUpFinalSteps = false;
  public queuedStepTypes: ActionResolutionStepType[] = [];

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

    const action = COMBAT_ACTIONS[this.actionExecutionIntent.actionName];
    this.queuedStepTypes = action.stepsConfig.getStepTypes();

    const firstStepOption = this.initializeNextStep();
    if (firstStepOption === null) throw new Error("expected first action step missing");
    this.currentStep = firstStepOption;
  }

  initializeNextStep() {
    this.stepIndex += 1;
    const context: ActionResolutionStepContext = {
      combatantContext: this.parentActionManager.combatantContext,
      tracker: this,
      manager: this.parentActionManager,
      idGenerator: this.idGenerator,
    };
    const stepTypes = this.queuedStepTypes;
    let stepOption = stepTypes[this.stepIndex];

    const action = COMBAT_ACTIONS[this.actionExecutionIntent.actionName];

    if (stepOption === undefined && this.hasQueuedUpFinalSteps) return null;
    else if (stepOption === undefined) {
      // get final steps and set nextStepOption
      const finalSteps = action.stepsConfig.options.getFinalSteps(action.stepsConfig, context);

      const toQueue = iterateNumericEnumKeyedRecord(finalSteps)
        .sort(([aKey, aValue], [bKey, bValue]) => aKey - bKey)
        .map(([key, value]) => key);

      this.queuedStepTypes.push(...toQueue);

      this.hasQueuedUpFinalSteps = true;
      stepOption = stepTypes[this.stepIndex];
    }

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

  getExpectedSpawnedActionEntity() {
    if (this.spawnedEntityOption?.type === SpawnableEntityType.ActionEntity)
      return this.spawnedEntityOption;
    else throw new Error("expected spawned action entity not found");
  }

  wasCountered() {
    return iterateNumericEnumKeyedRecord(this.hitOutcomes.outcomeFlags)
      .map(([key, value]) => key)
      .includes(HitOutcome.Counterattack);
  }
}
