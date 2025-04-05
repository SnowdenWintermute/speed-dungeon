import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
} from "../../index.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import { ATTACK_RANGED_MAIN_HAND_PROJECTILE } from "../attack/attack-ranged-main-hand-projectile.js";
import { PrimedForExplosionCombatantCondition } from "../../../../combatants/combatant-conditions/primed-for-explosion.js";

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  ...ATTACK_RANGED_MAIN_HAND_PROJECTILE,
  description: "An arrow that applies a detonatable condition",
  getAppliedConditions: (context) => {
    const { idGenerator, combatantContext } = context;
    const { combatant } = combatantContext;
    // @TODO - determine based on equipment, ex: ice sword applies "cold" condition

    const primedForExplosionCondition = new PrimedForExplosionCombatantCondition(
      idGenerator.generate(),
      combatant.entityProperties.id,
      combatant.combatantProperties.level
    );
    return [primedForExplosionCondition];
  },
};

export const EXPLODING_ARROW_PROJECTILE = new CombatActionComposite(
  CombatActionName.ExplodingArrowProjectile,
  config
);
