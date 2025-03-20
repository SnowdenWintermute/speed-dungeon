import { CombatantCondition, CombatantConditionName } from "./index.js";
import { Combatant, ENVIRONMENT_COMBATANT } from "../index.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";

export class PrimedForExplosionCombatantCondition implements CombatantCondition {
  name = CombatantConditionName.PrimedForExplosion;
  stacksOption = new MaxAndCurrent(10, 1);
  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public level: number
  ) {}
  onTick() {}
  triggeredWhenHitBy(actionName: CombatActionName) {
    console.log("CHECKING FOR TRIGGER:", COMBAT_ACTION_NAME_STRINGS[actionName]);
    return actionName !== CombatActionName.ExplodingArrowProjectile;
  }
  triggeredWhenActionUsed() {
    return false;
  }
  onTriggered(combatant: Combatant) {
    combatant.combatantProperties.conditions = combatant.combatantProperties.conditions.filter(
      (condition) => condition.id !== this.id
    );

    const explosionActionIntent = new CombatActionExecutionIntent(CombatActionName.Explosion, {
      type: CombatActionTargetType.SingleAndSides,
      targetId: combatant.entityProperties.id,
    });

    return {
      removedSelf: true,
      triggeredActions: [
        { user: ENVIRONMENT_COMBATANT, actionExecutionIntent: explosionActionIntent },
      ],
    };
  }
}
