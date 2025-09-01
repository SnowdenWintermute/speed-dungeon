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
import { AutoTargetingScheme } from "../../../targeting/index.js";
import { getRotateTowardPrimaryTargetDestination } from "../common-destination-getters.js";

const clonedConfig = cloneDeep(ATTACK_RANGED_MAIN_HAND_CONFIG);
const stepsConfig = clonedConfig.stepsConfig;
delete stepsConfig.steps[ActionResolutionStepType.InitialPositioning];
delete stepsConfig.steps[ActionResolutionStepType.PrepMotion];
delete stepsConfig.steps[ActionResolutionStepType.ChamberingMotion];

// normal ranged attack would rotate during prep, but we're skipping that step
const deliveryStep = stepsConfig.steps[ActionResolutionStepType.DeliveryMotion];
if (!deliveryStep) throw new Error("expected delivery step not present");
deliveryStep.getDestination = getRotateTowardPrimaryTargetDestination;

const finalStep = stepsConfig.steps[ActionResolutionStepType.FinalPositioning];
if (!finalStep) throw new Error("expected to have return home step configured");
delete finalStep.getAnimation; // because we don't want them running back

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  description: "Respond with a ranged attack target using equipment in main hand",
  costProperties: {
    ...clonedConfig.costProperties,
    costBases: {},
    requiresCombatTurnInThisContext: (context) => false,
  },
  stepsConfig,
  targetingProperties: {
    ...clonedConfig.targetingProperties,
    autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  },
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
      return [
        new CombatActionExecutionIntent(
          CombatActionName.CounterAttackRangedMainhandProjectile,
          context.tracker.actionExecutionIntent.targets,
          context.tracker.actionExecutionIntent.level
        ),
      ];
    },
  },
};

export const COUNTER_ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.CounterattackRangedMainhand,
  config
);
