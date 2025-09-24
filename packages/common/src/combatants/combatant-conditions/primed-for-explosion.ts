import { CombatantCondition, CombatantConditionName, ConditionAppliedBy } from "./index.js";
import { Combatant } from "../index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { immerable } from "immer";
import { ActionUserContext } from "../../action-user-context/index.js";

export class PrimedForExplosionCombatantCondition extends CombatantCondition {
  [immerable] = true;
  intent = CombatActionIntent.Malicious;
  removedOnDeath: boolean = true;
  ticks?: MaxAndCurrent | undefined;
  constructor(
    id: EntityId,
    appliedBy: ConditionAppliedBy,
    appliedTo: EntityId,
    public level: number,
    stacksOption: null | MaxAndCurrent
  ) {
    super(
      id,
      appliedBy,
      appliedTo,
      CombatantConditionName.PrimedForIceBurst,
      new MaxAndCurrent(10, 1)
    );
    if (stacksOption) this.stacksOption = stacksOption;
  }

  tickPropertiesOption = null;
  getAttributeModifiers = undefined;

  triggeredWhenHitBy(actionName: CombatActionName) {
    const actionsThatTrigger = [
      CombatActionName.AttackRangedMainhandProjectile,
      CombatActionName.CounterAttackRangedMainhandProjectile,
      CombatActionName.AttackMeleeMainhand,
      CombatActionName.AttackMeleeOffhand,
      CombatActionName.BurningTick,
      CombatActionName.FirewallBurn,
      CombatActionName.Fire,
      CombatActionName.ChainingSplitArrowProjectile,
    ];

    return actionsThatTrigger.includes(actionName);
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered(
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    const { actionUser } = actionUserContext;

    actionUser.getTargetingProperties().setSelectedTarget({
      type: CombatActionTargetType.Single,
      targetId: targetCombatant.entityProperties.id,
    });

    const conditionUserContext = new ActionUserContext(
      actionUserContext.game,
      actionUserContext.party,
      actionUser
    );

    const actionTarget = COMBAT_ACTIONS[
      CombatActionName.IceBurst
    ].targetingProperties.getAutoTarget(conditionUserContext, null);

    if (actionTarget instanceof Error) throw actionTarget;
    if (actionTarget === null) throw new Error("failed to get auto target");

    const explosionLevel = actionUser.getLevel() * (this.stacksOption?.current || 1);

    const actionExecutionIntent = new CombatActionExecutionIntent(
      CombatActionName.Explosion,
      explosionLevel,
      actionTarget
    );

    return {
      numStacksRemoved: 1,
      triggeredActions: [{ user: actionUser, actionExecutionIntent }],
    };
  }

  getCosmeticEffectWhileActive = () => [];
}
