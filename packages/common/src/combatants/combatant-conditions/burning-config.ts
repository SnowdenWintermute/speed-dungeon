import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import {
  CombatActionTargetSingle,
  CombatActionTargetType,
} from "../../combat/targeting/combat-action-targets.js";
import { BASE_CONDITION_TICK_SPEED } from "../../combat/turn-order/consts.js";
import {
  CharacterModelIdentifier,
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../scene-entities/index.js";
import { CombatantConditionConfig, CombatantConditionInit } from "./combatant-condition-config.js";
import { CombatantCondition } from "./index.js";

export function BURNING_CONFIG_CREATOR(init: CombatantConditionInit): CombatantConditionConfig {
  return {
    ...init,
    intent: CombatActionIntent.Malicious,
    tickPropertiesOption: {
      getTickSpeed(condition: CombatantCondition) {
        return condition.level * BASE_CONDITION_TICK_SPEED;
      },
      onTick(context: ActionUserContext) {
        const user = context.actionUser;

        const targets: CombatActionTargetSingle = {
          type: CombatActionTargetType.Single,
          targetId: user.getConditionAppliedTo(),
        };

        user.getTargetingProperties().setSelectedTarget(targets);

        const triggeredAction = {
          actionIntentAndUser: {
            user,
            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.BurningTick,
              user.getLevel(),
              targets
            ),
          },
        };

        return {
          numStacksRemoved: 1,
          triggeredAction,
        };
      },
    },
    getCosmeticEffectWhileActive(self, appliedToId) {
      const sceneEntityIdentifier: CharacterModelIdentifier = {
        type: SceneEntityType.CharacterModel,
        entityId: appliedToId,
      };
      const parent: CombatantBaseChildTransformNodeIdentifier = {
        sceneEntityIdentifier,
        transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
      };

      const effect = {
        name: CosmeticEffectNames.Burning,
        parent,
      };

      return [effect];
    },
  };
}
