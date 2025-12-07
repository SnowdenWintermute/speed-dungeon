import { MaxAndCurrent } from "../../index.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { CombatantConditionConfig, CombatantConditionInit } from "../condition-config.js";

export function PRIMED_FOR_EXPLOSION_CONFIG_CREATOR(
  init: CombatantConditionInit
): CombatantConditionConfig {
  return {
    ...init,
    intent: CombatActionIntent.Malicious,
    stacksOption: new MaxAndCurrent(10, 1),
    triggeredWhenHitBy: [
      CombatActionName.AttackRangedMainhandProjectile,
      CombatActionName.CounterAttackRangedMainhandProjectile,
      CombatActionName.AttackMeleeMainhand,
      CombatActionName.AttackMeleeOffhand,
      CombatActionName.BurningTick,
      CombatActionName.FirewallBurn,
      CombatActionName.ExecuteExplosion,
      CombatActionName.Fire,
      CombatActionName.ChainingSplitArrowProjectile,
    ],
    onTriggered(self, actionUserContext, targetCombatant, idGenerator) {
      const actionUser = self;

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
        numStacksRemoved: self.stacksOption?.current || 1,
        triggeredActions: [{ user: actionUser, actionExecutionIntent }],
      };
    },
  };
}
