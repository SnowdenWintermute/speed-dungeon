import {
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
} from "../../index.js";
import { COUNTER_ATTACK } from "./index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ATTACK_RANGED_MAIN_HAND_CONFIG } from "../attack/attack-ranged-main-hand.js";
import cloneDeep from "lodash.clonedeep";
import { getRotateTowardPrimaryTargetDestination } from "../common-destination-getters.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";

const clonedConfig = cloneDeep(ATTACK_RANGED_MAIN_HAND_CONFIG);
const stepsConfig = clonedConfig.stepsConfig;
delete stepsConfig.steps[ActionResolutionStepType.InitialPositioning];
delete stepsConfig.steps[ActionResolutionStepType.PrepMotion];
delete stepsConfig.steps[ActionResolutionStepType.ChamberingMotion];

// normal ranged attack would rotate during prep, but we're skipping that step so we'll rotate here instead
const deliveryStep = stepsConfig.steps[ActionResolutionStepType.DeliveryMotion];
if (!deliveryStep) throw new Error("expected delivery step not present");
deliveryStep.getDestination = getRotateTowardPrimaryTargetDestination;

const finalStep = stepsConfig.finalSteps[ActionResolutionStepType.FinalPositioning];
if (!finalStep) throw new Error("expected to have return home step configured");
delete finalStep.getAnimation; // because we don't want them running back

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  description: "Respond with a ranged attack target using equipment in main hand",
  costProperties: createCostPropertiesConfig(COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION, {
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
  }),
  stepsConfig,
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.COPY_PARENT_HOSTILE(),
  hitOutcomeProperties: {
    ...clonedConfig.hitOutcomeProperties,
    getCanTriggerCounterattack: () => false,
    getShouldAnimateTargetHitRecovery: () => false,
    getIsBlockable: () => false,
    getIsParryable: () => false,
  },

  hierarchyProperties: {
    ...clonedConfig.hierarchyProperties,
    getParent: () => COUNTER_ATTACK,
    getConcurrentSubActions(context) {
      const expectedProjectile = context.tracker.getFirstExpectedSpawnedActionEntity();

      const { rank, targets } = context.tracker.actionExecutionIntent;

      return [
        {
          user: expectedProjectile.actionEntity,
          actionExecutionIntent: new CombatActionExecutionIntent(
            CombatActionName.CounterAttackRangedMainhandProjectile,
            rank,
            targets
          ),
        },
      ];
    },
  },
};

config.targetingProperties.executionPreconditions = [
  ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.UserIsAlive],
  ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
];

export const COUNTER_ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.CounterattackRangedMainhand,
  config
);
