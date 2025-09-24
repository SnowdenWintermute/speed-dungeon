import { CombatantCondition, CombatantConditionName, ConditionAppliedBy } from "./index.js";
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
import { ActionUserContext } from "../../combatant-context/action-user.js";

export class BurningCombatantCondition extends CombatantCondition {
  [immerable] = true;
  name = CombatantConditionName.Burning;
  intent = CombatActionIntent.Malicious;
  stacksOption = new MaxAndCurrent(1, 10);
  removedOnDeath: boolean = true;
  ticks?: MaxAndCurrent | undefined;
  constructor(
    id: EntityId,
    appliedBy: ConditionAppliedBy,
    appliedTo: EntityId,
    public level: number,
    stacksOption: null | MaxAndCurrent
  ) {
    super(id, appliedBy, appliedTo, CombatantConditionName.Burning, stacksOption);
  }

  getAttributeModifiers = undefined;

  tickPropertiesOption = {
    getTickSpeed(condition: CombatantCondition) {
      return condition.level * BASE_CONDITION_TICK_SPEED;
    },
    onTick(context: ActionUserContext) {
      const user = context.actionUser;

      const targets: CombatActionTargetSingle = {
        type: CombatActionTargetType.Single,
        targetId: user.getEntityId(),
      };

      user.getTargetingProperties().setSelectedTarget(targets);

      return {
        numStacksRemoved: 1,
        triggeredAction: {
          actionIntentAndUser: {
            user,
            actionExecutionIntent: new CombatActionExecutionIntent(
              CombatActionName.BurningTick,
              user.getLevel(),
              targets
            ),
          },
        },
      };
    },
  };

  triggeredWhenHitBy(actionName: CombatActionName) {
    // anything that removes burning
    return false;
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered() {
    return {
      numStacksRemoved: this.stacksOption.current,
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
      transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
    };

    const effect = {
      name: CosmeticEffectNames.Burning,
      parent,
    };

    return [effect];
  };
}
