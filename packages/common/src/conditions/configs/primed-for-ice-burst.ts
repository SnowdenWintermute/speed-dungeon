import makeAutoObservable from "mobx-store-inheritance";
import { CombatantConditionInit } from "../condition-config.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { Combatant } from "../../combatants/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { CombatantCondition } from "../index.js";
import { runIfInBrowser } from "../../utils/index.js";
import { CombatActionIntent } from "../../combat/combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { ActionRank } from "../../aliases.js";

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
      this.getLevel() as ActionRank,
      actionTarget
    );

    return {
      numStacksRemoved: this.stacksOption?.current || 1,
      triggeredActions: [{ user: this, actionExecutionIntent }],
    };
  }
}
