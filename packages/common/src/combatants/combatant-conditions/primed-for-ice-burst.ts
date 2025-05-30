import {
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantConditionName,
} from "./index.js";
import { Combatant, createTriggeredActionUserCombatant } from "../index.js";
import {
  CombatActionExecutionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import {
  CharacterModelIdentifier,
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../scene-entities/index.js";

export class PrimedForIceBurstCombatantCondition implements CombatantCondition {
  name = CombatantConditionName.PrimedForIceBurst;
  stacksOption = new MaxAndCurrent(1, 1);
  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public appliedBy: EntityId,
    public level: number
  ) {}
  onTick() {}

  triggeredWhenHitBy(actionName: CombatActionName) {
    const actionsThatDontTrigger = [CombatActionName.IceBoltProjectile, CombatActionName.IceBurst];
    return !actionsThatDontTrigger.includes(actionName);
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered(combatant: Combatant, idGenerator: IdGenerator) {
    const actionExecutionIntent = new CombatActionExecutionIntent(CombatActionName.IceBurst, {
      type: CombatActionTargetType.Sides,
      targetId: combatant.entityProperties.id,
    });

    const user = createTriggeredActionUserCombatant(
      COMBATANT_CONDITION_NAME_STRINGS[this.name],
      this
    );

    return {
      numStacksRemoved: this.stacksOption.current,
      triggeredActions: [{ user, actionExecutionIntent }],
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
      name: CosmeticEffectNames.CombatantIsCold,
      parent,
    };

    return [effect];
  };
}
