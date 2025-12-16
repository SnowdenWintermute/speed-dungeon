import makeAutoObservable from "mobx-store-inheritance";
import { CombatActionIntent } from "../../combat/combat-actions/index.js";
import {
  ActionUserContext,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  Combatant,
  CombatantCondition,
  IdGenerator,
  MaxAndCurrent,
  runIfInBrowser,
} from "../../index.js";
import { CombatantConditionInit } from "../condition-config.js";

export class PrimedForIceBurstCondition extends CombatantCondition {
  constructor(init: CombatantConditionInit) {
    super(init);
    runIfInBrowser(() => makeAutoObservable(this));
  }

  intent = CombatActionIntent.Malicious;
  stacksOption = new MaxAndCurrent(1, 1);
  removedOnDeath = true;
  triggeredWhenHitBy = [
    CombatActionName.AttackMeleeMainhand,
    CombatActionName.AttackMeleeOffhand,
    CombatActionName.AttackRangedMainhandProjectile,
    CombatActionName.ExplodingArrowProjectile,
    CombatActionName.ChainingSplitArrowProjectile,
    CombatActionName.CounterattackMeleeMainhand,
    CombatActionName.CounterAttackRangedMainhandProjectile,
    CombatActionName.ExecuteExplosion,
    CombatActionName.FirewallBurn,
    CombatActionName.Fire,
  ];

  onTriggered(
    this: CombatantCondition,
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    this.getTargetingProperties().setSelectedTarget({
      type: CombatActionTargetType.Single,
      targetId: targetCombatant.entityProperties.id,
    });

    const conditionUserContext = new ActionUserContext(
      actionUserContext.game,
      actionUserContext.party,
      this
    );

    const actionTarget = COMBAT_ACTIONS[
      CombatActionName.IceBurstParent
    ].targetingProperties.getAutoTarget(conditionUserContext, null);

    if (actionTarget instanceof Error) {
      throw actionTarget;
    }

    if (actionTarget === null) {
      throw new Error("failed to get auto target");
    }

    const actionExecutionIntent = new CombatActionExecutionIntent(
      CombatActionName.IceBurstParent,
      this.getLevel(),
      actionTarget
    );

    return {
      numStacksRemoved: this.stacksOption?.current || 1,
      triggeredActions: [{ user: this, actionExecutionIntent }],
    };
  }
}
