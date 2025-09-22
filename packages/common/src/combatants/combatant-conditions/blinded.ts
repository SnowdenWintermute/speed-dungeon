import { CombatantCondition, CombatantConditionName, ConditionAppliedBy } from "./index.js";
import { CombatantProperties } from "../index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { BASE_CONDITION_TICK_SPEED } from "../../combat/turn-order/consts.js";
import {
  CombatActionTargetSingle,
  CombatActionTargetType,
} from "../../combat/targeting/combat-action-targets.js";
import { immerable } from "immer";
import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import {
  CharacterModelIdentifier,
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../scene-entities/index.js";
import { CombatAttribute } from "../attributes/index.js";
import { ActionUserContext } from "../../combatant-context/action-user.js";

export class BlindedCombatantCondition extends CombatantCondition {
  [immerable] = true;
  intent = CombatActionIntent.Malicious;
  removedOnDeath: boolean = true;
  ticks?: MaxAndCurrent | undefined;
  constructor(
    id: EntityId,
    appliedBy: ConditionAppliedBy,
    public level: number,
    stacksOption: null | MaxAndCurrent
  ) {
    super(id, appliedBy, CombatantConditionName.Blinded, stacksOption);
  }

  tickPropertiesOption = {
    getTickSpeed(condition: CombatantCondition) {
      // return condition.level * BASE_CONDITION_TICK_SPEED;
      return BASE_CONDITION_TICK_SPEED / (condition.level + 5);
    },
    onTick(actionUserContext: ActionUserContext) {
      const user = actionUserContext.actionUser;

      const targets: CombatActionTargetSingle = {
        type: CombatActionTargetType.Single,
        targetId: user.getEntityId(),
      };

      return {
        numStacksRemoved: 1,
        triggeredAction: {
          actionIntentAndUser: {
            user,
            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.ConditionPassTurn,
              0,
              targets
            ),
          },
        },
      };
    },
  };

  getAttributeModifiers(self: CombatantCondition, appliedTo: CombatantProperties) {
    return { [CombatAttribute.Accuracy]: -10 * (this.level + 1) };
  }

  triggeredWhenHitBy(actionName: CombatActionName) {
    // anything that removes burning
    return false;
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered() {
    return {
      numStacksRemoved: this.stacksOption?.current || 0,
      triggeredActions: [],
    };
  }

  getCosmeticEffectWhileActive = (combatantId: EntityId) => {
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
  };
}
