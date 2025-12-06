import { CombatActionIntent } from "../../combat/combat-actions/index.js";
import {
  ActionUserContext,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  MaxAndCurrent,
} from "../../index.js";
import { CombatantConditionConfig, CombatantConditionInit } from "./combatant-condition-config.js";

export function PRIMED_FOR_ICE_BURST_CONFIG_CREATOR(
  init: CombatantConditionInit
): CombatantConditionConfig {
  return {
    ...init,
    intent: CombatActionIntent.Malicious,
    stacksOption: new MaxAndCurrent(1, 1),
    triggeredWhenHitBy: [
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
