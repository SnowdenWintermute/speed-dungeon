import makeAutoObservable from "mobx-store-inheritance";
import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import {
  CombatActionTargetSingle,
  CombatActionTargetType,
} from "../../combat/targeting/combat-action-targets.js";
import { BASE_CONDITION_TICK_SPEED } from "../../combat/turn-order/consts.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";
import {
  CharacterModelIdentifier,
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../scene-entities/index.js";
import { runIfInBrowser } from "../../utils/index.js";
import { CombatantConditionInit } from "../condition-config.js";
import { CombatantCondition } from "../index.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
  ConditionTickProperties,
  EntityId,
} from "../../index.js";

export class BlindedCondition extends CombatantCondition {
  constructor(init: CombatantConditionInit) {
    super(init);

    if (init.stacks) {
      this.stacksOption = new MaxAndCurrent(10, init.stacks);
    }

    runIfInBrowser(() => makeAutoObservable(this));
  }

  intent = CombatActionIntent.Malicious;

  getAttributeModifiers(appliedTo: CombatantProperties) {
    return { [CombatAttribute.Accuracy]: -10 * (this.rank + 1) };
  }

  getTickProperties(): ConditionTickProperties | undefined {
    return new ConditionTickProperties(
      (condition: CombatantCondition) => {
        return BASE_CONDITION_TICK_SPEED / (condition.rank + 5);
      },
      (actionUserContext: ActionUserContext) => {
        const user = actionUserContext.actionUser;

        const targets: CombatActionTargetSingle = {
          type: CombatActionTargetType.Single,
          targetId: user.getEntityId(),
        };

        const triggeredAction = {
          actionIntentAndUser: {
            user,
            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.ConditionPassTurn,
              0,
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

  getCosmeticEffectWhileActive(combatantId: EntityId) {
    const sceneEntityIdentifier: CharacterModelIdentifier = {
      type: SceneEntityType.CharacterModel,
      entityId: combatantId,
    };
    const parent: CombatantBaseChildTransformNodeIdentifier = {
      sceneEntityIdentifier,
      transformNodeName: CombatantBaseChildTransformNodeName.Head,
    };

    const effect = {
      name: CosmeticEffectNames.DarkParticleAccumulation,
      parent,
    };

    return [effect];
  }
}
