import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
} from "../../index.js";
import cloneDeep from "lodash.clonedeep";
import { ATTACK_RANGED_MAIN_HAND_PROJECTILE_CONFIG } from "../attack/attack-ranged-main-hand-projectile.js";
import { COUNTER_ATTACK_RANGED_MAIN_HAND } from "./counter-attack-ranged-main-hand.js";

const clonedConfig = cloneDeep(ATTACK_RANGED_MAIN_HAND_PROJECTILE_CONFIG);

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  description: "An arrow from counterattack",
  costProperties: {
    ...clonedConfig.costProperties,

    costBases: {},
    requiresCombatTurnInThisContext: () => false,
  },
  hitOutcomeProperties: {
    ...clonedConfig.hitOutcomeProperties,
    getShouldAnimateTargetHitRecovery: () => false,
  },
  hierarchyProperties: {
    ...clonedConfig.hierarchyProperties,
    getParent: () => COUNTER_ATTACK_RANGED_MAIN_HAND,
  },
};

export const COUNTER_ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  config
);
