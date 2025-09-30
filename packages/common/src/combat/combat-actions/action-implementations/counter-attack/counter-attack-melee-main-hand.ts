import {
  ActionAccuracyType,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
} from "../../index.js";
import { COUNTER_ATTACK } from "./index.js";
import { ATTACK_MELEE_MAIN_HAND_CONFIG } from "../attack/attack-melee-main-hand.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import cloneDeep from "lodash.clonedeep";
import { getRotateTowardPrimaryTargetDestination } from "../common-destination-getters.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.MAIN_HAND_MELEE_ATTACK();
delete stepsConfig.steps[ActionResolutionStepType.InitialPositioning];
delete stepsConfig.steps[ActionResolutionStepType.ChamberingMotion];

// would normally rotate in an earlier skipped step
const deliveryStep = stepsConfig.steps[ActionResolutionStepType.DeliveryMotion];
if (!deliveryStep) throw new Error("expected delivery step not present");
deliveryStep.getDestination = getRotateTowardPrimaryTargetDestination;

const recoveryMotion = stepsConfig.finalSteps[ActionResolutionStepType.RecoveryMotion];
if (!recoveryMotion) throw new Error("expected to have recoveryMotion step configured");
recoveryMotion.shouldIdleOnComplete = true;

const finalStep = stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning];
if (!finalStep) throw new Error("expected to have return home step configured");
delete finalStep.getAnimation; // because we don't want them running back

const clonedConfig = cloneDeep(ATTACK_MELEE_MAIN_HAND_CONFIG);

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  description: "Respond with a melee attack target using equipment in main hand",
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig,
  hitOutcomeProperties: {
    ...clonedConfig.hitOutcomeProperties,
    getCanTriggerCounterattack: () => false,
    getShouldAnimateTargetHitRecovery: () => false,
    getIsBlockable: () => false,
    getIsParryable: () => false,
    getUnmodifiedAccuracy: () => {
      return { type: ActionAccuracyType.Unavoidable };
    },
  },
  hierarchyProperties: { ...clonedConfig.hierarchyProperties, getParent: () => COUNTER_ATTACK },
};

config.targetingProperties.executionPreconditions = [
  ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.UserIsAlive],
  ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
];

export const COUNTER_ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.CounterattackMeleeMainhand,
  config
);
