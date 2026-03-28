import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { ActionRank, EntityId } from "../../aliases.js";
import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatActionIntent } from "../../combat/combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import {
  CombatActionTargetSingle,
  CombatActionTargetType,
} from "../../combat/targeting/combat-action-targets.js";
import { BASE_CONDITION_TICK_SPEED } from "../../combat/turn-order/consts.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import {
  CharacterModelIdentifier,
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../scene-entities/index.js";
import { CombatantConditionInit } from "../condition-config.js";
import { ConditionTickProperties } from "../condition-tick-properties.js";
import { CombatantCondition, MAX_CONDITION_STACKS } from "../index.js";

export class BurningCondition extends CombatantCondition {
  constructor(init: CombatantConditionInit) {
    super(init);

    if (init.stacks) {
      this.stacksOption = new MaxAndCurrent(MAX_CONDITION_STACKS, init.stacks || 1);
    }
  }

  intent = CombatActionIntent.Malicious;

  getTickProperties(): ConditionTickProperties | undefined {
    return new ConditionTickProperties(
      (condition: CombatantCondition) => {
        return condition.rank * BASE_CONDITION_TICK_SPEED;
      },
      (context: ActionUserContext) => {
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
              user.getLevel() as ActionRank,
              targets
            ),
          },
        };

        return {
          numStacksRemoved: 1,
          triggeredAction,
        };
      }
    );
  }

  getCosmeticEffectWhileActive(appliedToId: EntityId) {
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
  }
}
