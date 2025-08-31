import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  FriendOrFoe,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND_PROJECTILE } from "../attack/attack-ranged-main-hand-projectile.js";
import cloneDeep from "lodash.clonedeep";
import { CombatantConditionName } from "../../../../combatants/index.js";
import {
  EXPLODING_ARROW_PARENT,
  EXPLODING_ARROW_PROJECTILE_HIT_OUTCOME_PROPERTIES,
} from "./index.js";

const hierarchyProperties = {
  ...ATTACK_RANGED_MAIN_HAND_PROJECTILE.hierarchyProperties,
};

const config: CombatActionComponentConfig = {
  ...cloneDeep(ATTACK_RANGED_MAIN_HAND_PROJECTILE),
  hitOutcomeProperties: EXPLODING_ARROW_PROJECTILE_HIT_OUTCOME_PROPERTIES,
  hierarchyProperties,
  description: "An arrow that applies a detonatable condition",
};

export const EXPLODING_ARROW_PROJECTILE = new CombatActionComposite(
  CombatActionName.ExplodingArrowProjectile,
  config
);

EXPLODING_ARROW_PROJECTILE.hierarchyProperties.getParent = () => EXPLODING_ARROW_PARENT;
