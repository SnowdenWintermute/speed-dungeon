import {
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantConditionName,
  ConditionAppliedBy,
} from "./index.js";
import { CombatantProperties, createShimmedUserOfTriggeredCondition } from "../index.js";
import { CombatActionIntent, CombatActionName } from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
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

export class BlindedCombatantCondition implements CombatantCondition {
  [immerable] = true;
  name = CombatantConditionName.Blinded;
  stacksOption = new MaxAndCurrent(10, 1);
  intent = CombatActionIntent.Malicious;
  removedOnDeath: boolean = true;
  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public appliedBy: ConditionAppliedBy,
    public level: number
  ) {
    this.stacksOption.current = level * 2;
  }

  getTickSpeed(condition: CombatantCondition) {
    // return condition.level * BASE_CONDITION_TICK_SPEED;
    return condition.level * BASE_CONDITION_TICK_SPEED;
  }

  onTick(condition: CombatantCondition, context: CombatantContext) {
    const user = createShimmedUserOfTriggeredCondition(
      COMBATANT_CONDITION_NAME_STRINGS[condition.name],
      condition,
      context.combatant.entityProperties.id
    );

    const targets: CombatActionTargetSingle = {
      type: CombatActionTargetType.Single,
      targetId: context.combatant.entityProperties.id,
    };

    return {
      numStacksRemoved: 1,
      triggeredAction: {
        user,
        actionExecutionIntent: {
          actionName: CombatActionName.PassTurn,
          targets,
          getConsumableType: () => null,
        },
      },
    };
  }

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
      transformNodeName: CombatantBaseChildTransformNodeName.Head,
    };

    const effect = {
      name: CosmeticEffectNames.DarkParticleAccumulation,
      parent,
    };

    return [effect];
  };
}
