import { CombatActionComponentConfig, CombatActionLeaf, CombatActionName } from "../../index.js";
import { COUNTER_ATTACK } from "./index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { getMeleeAttackBaseStepsConfig } from "../attack/base-melee-attack-steps-config.js";
import { ATTACK_MELEE_MAIN_HAND_CONFIG } from "../attack/attack-melee-main-hand.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import cloneDeep from "lodash.clonedeep";
import { getRotateTowardPrimaryTargetDestination } from "../common-destination-getters.js";

const stepsConfig = getMeleeAttackBaseStepsConfig(HoldableSlotType.MainHand);
delete stepsConfig.steps[ActionResolutionStepType.InitialPositioning];
delete stepsConfig.steps[ActionResolutionStepType.ChamberingMotion];

// would normally rotate in an earlier skipped step
const deliveryStep = stepsConfig.steps[ActionResolutionStepType.DeliveryMotion];
if (!deliveryStep) throw new Error("expected delivery step not present");
deliveryStep.getDestination = getRotateTowardPrimaryTargetDestination;

const finalStep = stepsConfig.steps[ActionResolutionStepType.FinalPositioning];
if (!finalStep) throw new Error("expected to have return home step configured");
delete finalStep.getAnimation; // because we don't want them running back

const clonedConfig = cloneDeep(ATTACK_MELEE_MAIN_HAND_CONFIG);

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  description: "Respond with a melee attack target using equipment in main hand",
  costProperties: {
    ...clonedConfig.costProperties,
    costBases: {},
    requiresCombatTurnInThisContext: (context) => false,
  },
  stepsConfig,
  hitOutcomeProperties: {
    ...clonedConfig.hitOutcomeProperties,
    getCanTriggerCounterattack: () => false,
    getShouldAnimateTargetHitRecovery: () => false,
    getIsBlockable: () => false,
    getIsParryable: () => false,
  },

  shouldExecute: () => true,
  hierarchyProperties: { ...clonedConfig.hierarchyProperties, getParent: () => COUNTER_ATTACK },
};

export const COUNTER_ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.CounterattackMeleeMainhand,
  config
);
