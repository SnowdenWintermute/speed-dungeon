import { CombatantConditionInit } from "./condition-config.js";
import { CombatantConditionName } from "./condition-names.js";
import { BurningCondition } from "./configs/burning.js";
import { BlindedCondition } from "./configs/blinded.js";
import { EnsnaredCondition } from "./configs/ensnared.js";
import { FlyingCondition } from "./configs/flying.js";
import { FollowingPetCommandCondition } from "./configs/following-pet-command.js";
import { PrimedForExplosionCondition } from "./configs/primed-for-explosion.js";
import { PrimedForIceBurstCondition } from "./configs/primed-for-ice-burst.js";
import { CombatantCondition } from "./index.js";

type CombatantConditionConstructor = new (init: CombatantConditionInit) => CombatantCondition;

export class CombatantConditionFactory {
  static create(init: CombatantConditionInit): CombatantCondition {
    return new CONDITION_CONSTRUCTORS[init.name](init);
  }
}

const CONDITION_CONSTRUCTORS: Record<CombatantConditionName, CombatantConditionConstructor> = {
  [CombatantConditionName.PrimedForExplosion]: PrimedForExplosionCondition,
  [CombatantConditionName.PrimedForIceBurst]: PrimedForIceBurstCondition,
  [CombatantConditionName.Burning]: BurningCondition,
  [CombatantConditionName.Blinded]: BlindedCondition,
  [CombatantConditionName.FollowingPetCommand]: FollowingPetCommandCondition,
  [CombatantConditionName.Flying]: FlyingCondition,
  [CombatantConditionName.Ensnared]: EnsnaredCondition,
};
