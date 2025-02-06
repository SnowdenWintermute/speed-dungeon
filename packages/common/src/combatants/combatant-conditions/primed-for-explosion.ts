import { CombatantCondition, CombatantConditionName } from ".";
import { Combatant } from "..";
import { CombatActionName } from "../../combat/combat-actions";
import { EntityId, MaxAndCurrent } from "../../primatives";

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

//PRIMED_FOR_EXPLOSION_CONDITION.triggeredWhenHitBy = (actionName) => {
//  ;
//  //
//};

//PRIMED_FOR_EXPLOSION_CONDITION.onTriggered = (combatant) => {
//};
