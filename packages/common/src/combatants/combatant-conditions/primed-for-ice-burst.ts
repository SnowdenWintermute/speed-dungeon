import {
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantConditionName,
  ConditionAppliedBy,
} from "./index.js";
import { Combatant, createShimmedUserOfTriggeredCondition } from "../index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
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
import { CombatantContext } from "../../combatant-context/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { immerable } from "immer";

export class PrimedForIceBurstCombatantCondition implements CombatantCondition {
  [immerable] = true;
  name = CombatantConditionName.PrimedForIceBurst;
  stacksOption = new MaxAndCurrent(1, 1);
  intent = CombatActionIntent.Malicious;
  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    public appliedBy: ConditionAppliedBy,
    public level: number
  ) {}

  triggeredWhenHitBy(actionName: CombatActionName) {
    const actionsThatDontTrigger = [
      CombatActionName.IceBoltProjectile,
      CombatActionName.IceBurst,
      CombatActionName.UseBlueAutoinjector,
      CombatActionName.UseGreenAutoinjector,
    ];
    return !actionsThatDontTrigger.includes(actionName);
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered(
    combatantContext: CombatantContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    const user = createShimmedUserOfTriggeredCondition(
      COMBATANT_CONDITION_NAME_STRINGS[this.name],
      this,
      targetCombatant.entityProperties.id
    );

    user.combatantProperties.combatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: targetCombatant.entityProperties.id,
    };

    const combatantContextFromConditionUserPerspective = new CombatantContext(
      combatantContext.game,
      combatantContext.party,
      user
    );

    const actionTarget = COMBAT_ACTIONS[
      CombatActionName.IceBurst
    ].targetingProperties.getAutoTarget(combatantContextFromConditionUserPerspective, null);

    if (actionTarget instanceof Error) throw actionTarget;
    if (actionTarget === null) throw new Error("failed to get auto target");

    const actionExecutionIntent = new CombatActionExecutionIntent(
      CombatActionName.IceBurst,
      actionTarget
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
