import { Vector3 } from "@babylonjs/core";
import { CombatActionIntent } from "../../combat/combat-actions/index.js";
import { TransformModifiers } from "../../scene-entities/index.js";
import { CombatantConditionConfig, CombatantConditionInit } from "../condition-config.js";
import {
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  Meters,
} from "../../index.js";

const FLYING_HEIGHT: Meters = 2;

export function FLYING_CONFIG_CREATOR(init: CombatantConditionInit): CombatantConditionConfig {
  return {
    ...init,
    intent: CombatActionIntent.Benevolent,
    getDescription(): string {
      return `Unreachable by non-flying melee attackers`;
    },
    getTransformModifiers(): TransformModifiers {
      return { homePosition: new Vector3(0, FLYING_HEIGHT, 0) };
    },
    triggeredWhenHitBy: [CombatActionName.Fire],

    onTriggered(self, actionUserContext, targetCombatant, idGenerator) {
      const actionUser = actionUserContext.party.combatantManager.getExpectedCombatant(
        self.getConditionAppliedTo()
      );

      console.log("triggering fall toward home position used by target :", actionUser);
      return {
        numStacksRemoved: self.stacksOption?.current || 1,
        triggeredActions: [
          {
            user: actionUser,

            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.FallTowardsHomePosition,

              1,

              { type: CombatActionTargetType.Single, targetId: actionUser.getEntityId() }
            ),
          },
        ],
      };
    },
  };
}
