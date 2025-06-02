import { CombatActionComponentConfig, CombatActionLeaf, CombatActionName } from "../../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ATTACK_MELEE_OFF_HAND_CONFIG } from "../attack/attack-melee-off-hand.js";
import cloneDeep from "lodash.clonedeep";

const stepsConfig = cloneDeep(ATTACK_MELEE_OFF_HAND_CONFIG.stepsConfig);
delete stepsConfig.steps[ActionResolutionStepType.InitialPositioning];
delete stepsConfig.steps[ActionResolutionStepType.ChamberingMotion];

const clonedConfig = cloneDeep(ATTACK_MELEE_OFF_HAND_CONFIG);

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  description: "Respond with a melee attack target using equipment in off hand",
  stepsConfig,
  costProperties: {
    ...clonedConfig.costProperties,
    requiresCombatTurn: () => false,
  },
  hitOutcomeProperties: {
    ...clonedConfig.hitOutcomeProperties,
    getCanTriggerCounterattack: () => false,
  },
};

export const COUNTER_ATTACK_MELEE_OFF_HAND = new CombatActionLeaf(
  CombatActionName.CounterattackMeleeOffhand,
  config
);
