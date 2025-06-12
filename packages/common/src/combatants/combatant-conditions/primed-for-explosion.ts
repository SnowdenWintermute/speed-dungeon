import {
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantConditionName,
  ConditionAppliedBy,
  ConditionTickProperties,
} from "./index.js";
import { Combatant, createShimmedUserOfTriggeredCondition } from "../index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatantContext } from "../../combatant-context/index.js";

export class PrimedForExplosionCombatantCondition implements CombatantCondition {
  name = CombatantConditionName.PrimedForExplosion;
  stacksOption = new MaxAndCurrent(10, 1);
  intent = CombatActionIntent.Malicious;
  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public appliedBy: ConditionAppliedBy,
    public level: number
  ) {}

  triggeredWhenHitBy(actionName: CombatActionName) {
    const actionsThatDontTrigger = [
      CombatActionName.IceBoltProjectile,
      CombatActionName.IceBurst,
      CombatActionName.UseBlueAutoinjector,
      CombatActionName.UseGreenAutoinjector,
      CombatActionName.ExplodingArrowProjectile,
    ];

    return !actionsThatDontTrigger.includes(actionName);
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered(
    combatantContext: CombatantContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    const user = createShimmedUserOfTriggeredCondition(
      COMBATANT_CONDITION_NAME_STRINGS[this.name],
      this,
      targetCombatant.entityProperties.id
    );

    user.combatantProperties.combatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: targetCombatant.entityProperties.id,
    };

    console.log(
      "primed for explosion sets shimmed user target as:",
      targetCombatant.entityProperties.id
    );

    const combatantContextFromConditionUserPerspective = new CombatantContext(
      combatantContext.game,
      combatantContext.party,
      user
    );

    const actionTarget = COMBAT_ACTIONS[
      CombatActionName.Explosion
    ].targetingProperties.getAutoTarget(combatantContextFromConditionUserPerspective, null);

    if (actionTarget instanceof Error) throw actionTarget;
    if (actionTarget === null) throw new Error("failed to get auto target");

    console.log("primed for explosion sets action target as:", actionTarget);

    const explosionActionIntent = new CombatActionExecutionIntent(
      CombatActionName.Explosion,
      actionTarget
    );

    return {
      numStacksRemoved: 1,
      triggeredActions: [{ user, actionExecutionIntent: explosionActionIntent }],
    };
  }

  getCosmeticEffectWhileActive = () => [];
}
