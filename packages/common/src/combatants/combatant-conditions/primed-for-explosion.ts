import {
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantConditionName,
  ConditionAppliedBy,
} from "./index.js";
import { Combatant, createShimmedUserOfTriggeredCondition } from "../index.js";
import {
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
    public appliedBy: ConditionAppliedBy,
    public level: number
  ) {}

  onTick() {}

  triggeredWhenHitBy(actionName: CombatActionName) {
    return actionName !== CombatActionName.ExplodingArrowProjectile;
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered(combatant: Combatant, idGenerator: IdGenerator) {
    const explosionActionIntent = new CombatActionExecutionIntent(CombatActionName.Explosion, {
      type: CombatActionTargetType.SingleAndSides,
      targetId: combatant.entityProperties.id,
    });

    const user = createShimmedUserOfTriggeredCondition(
      COMBATANT_CONDITION_NAME_STRINGS[this.name],
      this,
      combatant.entityProperties.id
    );

    return {
      numStacksRemoved: 1,
      triggeredActions: [{ user, actionExecutionIntent: explosionActionIntent }],
    };
  }

  getCosmeticEffectWhileActive = () => [];
}
