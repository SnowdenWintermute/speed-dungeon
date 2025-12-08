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

export class PrimedForExplosionCondition extends CombatantCondition {
  constructor(init: CombatantConditionInit) {
    super(init);
    runIfInBrowser(() => makeAutoObservable(this));
  }

  intent = CombatActionIntent.Malicious;
  stacksOption = new MaxAndCurrent(1, 1);
  removedOnDeath = true;
  triggeredWhenHitBy = [
    CombatActionName.AttackRangedMainhandProjectile,
    CombatActionName.CounterAttackRangedMainhandProjectile,
    CombatActionName.AttackMeleeMainhand,
    CombatActionName.AttackMeleeOffhand,
    CombatActionName.BurningTick,
    CombatActionName.FirewallBurn,
    CombatActionName.ExecuteExplosion,
    CombatActionName.Fire,
    CombatActionName.ChainingSplitArrowProjectile,
  ];

  onTriggered(
    this: CombatantCondition,
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    const actionUser = this;

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
      CombatActionName.SpawnExplosion
    ].targetingProperties.getAutoTarget(conditionUserContext, null);

    if (actionTarget instanceof Error) throw actionTarget;
    if (actionTarget === null) throw new Error("failed to get auto target");

    const actionExecutionIntent = new CombatActionExecutionIntent(
      CombatActionName.SpawnExplosion,
      actionUser.getLevel(),
      actionTarget
    );

    return {
      numStacksRemoved: this.stacksOption?.current || 1,
      triggeredActions: [{ user: actionUser, actionExecutionIntent }],
    };
  }
}
