import {
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantConditionName,
} from "./index.js";
import { Combatant, createTriggeredActionUserCombatant } from "../index.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { IdGenerator } from "../../utility-classes/index.js";

export class PrimedForExplosionCombatantCondition implements CombatantCondition {
  name = CombatantConditionName.PrimedForExplosion;
  stacksOption = new MaxAndCurrent(10, 1);
  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public appliedBy: EntityId,
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
  onTriggered(combatant: Combatant, idGenerator: IdGenerator) {
    console.log("remaining conditions before removal: ", combatant.combatantProperties.conditions);

    const removed = CombatantCondition.removeById(this.id, combatant.combatantProperties);
    console.log("REMOVED: ", removed?.level, removed?.stacksOption?.current);

    console.log("remaining conditions after removval: ", combatant.combatantProperties.conditions);

    const explosionActionIntent = new CombatActionExecutionIntent(CombatActionName.Explosion, {
      type: CombatActionTargetType.SingleAndSides,
      targetId: combatant.entityProperties.id,
    });

    const user = createTriggeredActionUserCombatant(
      COMBATANT_CONDITION_NAME_STRINGS[this.name],
      this
    );

    return {
      numStacksRemoved: this.stacksOption.current,
      triggeredActions: [{ user, actionExecutionIntent: explosionActionIntent }],
    };
  }
}
