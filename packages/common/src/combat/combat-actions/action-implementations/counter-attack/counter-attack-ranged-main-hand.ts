import { CombatActionComponentConfig, CombatActionLeaf, CombatActionName } from "../../index.js";
import { COUNTER_ATTACK } from "./index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ATTACK_RANGED_MAIN_HAND_CONFIG } from "../attack/attack-ranged-main-hand.js";
import cloneDeep from "lodash.clonedeep";

const clonedConfig = cloneDeep(ATTACK_RANGED_MAIN_HAND_CONFIG);
const stepsConfig = clonedConfig.stepsConfig;
delete stepsConfig.steps[ActionResolutionStepType.InitialPositioning];
delete stepsConfig.steps[ActionResolutionStepType.PrepMotion];
delete stepsConfig.steps[ActionResolutionStepType.ChamberingMotion];

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  description: "Respond with a ranged attack target using equipment in main hand",
  costProperties: {
    ...clonedConfig.costProperties,
    requiresCombatTurn: (context) => false,
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
  getChildren: () => [],
  getParent: () => COUNTER_ATTACK,
};

export const COUNTER_ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.CounterattackRangedMainhand,
  config
);
