import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  FriendOrFoe,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND_PROJECTILE } from "../attack/attack-ranged-main-hand-projectile.js";
import { PrimedForExplosionCombatantCondition } from "../../../../combatants/combatant-conditions/primed-for-explosion.js";
import cloneDeep from "lodash.clonedeep";

const config: CombatActionComponentConfig = {
  ...cloneDeep(ATTACK_RANGED_MAIN_HAND_PROJECTILE),
  description: "An arrow that applies a detonatable condition",
};

config.hitOutcomeProperties.getAppliedConditions = (combatantContext, idGenerator, actionLevel) => {
  const { combatant } = combatantContext;

  const primedForExplosionCondition = new PrimedForExplosionCombatantCondition(
    idGenerator.generate(),
    {
      entityProperties: cloneDeep(combatant.entityProperties),
      friendOrFoe: FriendOrFoe.Hostile,
    },
    combatant.combatantProperties.level
  );
  return [primedForExplosionCondition];
};

export const EXPLODING_ARROW_PROJECTILE = new CombatActionComposite(
  CombatActionName.ExplodingArrowProjectile,
  config
);
