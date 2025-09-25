import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { BlindedCombatantCondition } from "./blinded.js";
import { BurningCombatantCondition } from "./burning.js";
import { CombatantCondition, CombatantConditionName, ConditionAppliedBy } from "./index.js";
import { PrimedForExplosionCombatantCondition } from "./primed-for-explosion.js";
import { PrimedForIceBurstCombatantCondition } from "./primed-for-ice-burst.js";

type CombatantConditionConstructor = new (
  id: EntityId,
  appliedBy: ConditionAppliedBy,
  appliedTo: EntityId,
  level: number,
  stacksOption: null | MaxAndCurrent
) => CombatantCondition;

export const COMBATANT_CONDITION_CONSTRUCTORS: Record<
  CombatantConditionName,
  CombatantConditionConstructor
> = {
  [CombatantConditionName.PrimedForExplosion]: PrimedForExplosionCombatantCondition,
  [CombatantConditionName.PrimedForIceBurst]: PrimedForIceBurstCombatantCondition,
  [CombatantConditionName.Burning]: BurningCombatantCondition,
  [CombatantConditionName.Blinded]: BlindedCombatantCondition,
};
