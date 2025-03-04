import { CombatantCondition, CombatantConditionName } from "./index.js";
import { Combatant } from "../index.js";
import { CombatActionName } from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";

export class PrimedForExplosionCombatantCondition implements CombatantCondition {
  name = CombatantConditionName.PrimedForExplosion;
  stacks?: MaxAndCurrent | undefined;
  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public level: number
  ) {}
  onTick() {}
  triggeredWhenHitBy(actionName: CombatActionName) {
    return actionName === CombatActionName.ChainingSplitArrowProjectile;
  }
  triggeredWhenActionUsed() {
    return false;
  }
  onTriggered(combatant: Combatant) {
    combatant.combatantProperties.conditions = combatant.combatantProperties.conditions.filter(
      (condition) => condition.id !== this.id
    );

    return [];
  }
}
