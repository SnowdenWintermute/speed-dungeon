import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  FriendOrFoe,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND_PROJECTILE } from "../attack/attack-ranged-main-hand-projectile.js";
import cloneDeep from "lodash.clonedeep";
import { CombatantConditionName } from "../../../../combatants/index.js";

const config: CombatActionComponentConfig = {
  ...cloneDeep(ATTACK_RANGED_MAIN_HAND_PROJECTILE),
  description: "An arrow that applies a detonatable condition",
};

config.hitOutcomeProperties.getAppliedConditions = (user, actionLevel) => {
  return [
    {
      conditionName: CombatantConditionName.PrimedForExplosion,
      level: actionLevel,
      stacks: 1,
      appliedBy: { entityProperties: user.entityProperties, friendOrFoe: FriendOrFoe.Hostile },
    },
  ];
};

export const EXPLODING_ARROW_PROJECTILE = new CombatActionComposite(
  CombatActionName.ExplodingArrowProjectile,
  config
);
