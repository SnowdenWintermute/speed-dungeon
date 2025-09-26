import {
  CombatantCondition,
  CombatantConditionName,
  ConditionAppliedBy,
  ConditionTickProperties,
} from "./index.js";
import { Combatant } from "../index.js";
import {
  CombatActionExecutionIntent,
  CombatActionIntent,
  CombatActionName,
} from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent, Option } from "../../primatives/index.js";
import { CombatActionTargetType } from "../../combat/targeting/combat-action-targets.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import {
  CharacterModelIdentifier,
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../scene-entities/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { immerable } from "immer";
import { ActionUserContext } from "../../action-user-context/index.js";
import { ActionUserTargetingProperties } from "../../action-user-context/action-user-targeting-properties.js";

export class PrimedForIceBurstCombatantCondition extends CombatantCondition {
  [immerable] = true;
  name = CombatantConditionName.PrimedForIceBurst;
  stacksOption = new MaxAndCurrent(1, 1);
  intent = CombatActionIntent.Malicious;
  removedOnDeath: boolean = true;
  ticks?: MaxAndCurrent | undefined;
  constructor(
    public id: EntityId,
    appliedBy: ConditionAppliedBy,
    appliedTo: EntityId,
    public level: number
  ) {
    super(
      id,
      appliedBy,
      appliedTo,
      CombatantConditionName.PrimedForIceBurst,
      new MaxAndCurrent(1, 1)
    );
    this.targetingProperties = new ActionUserTargetingProperties();
  }

  tickPropertiesOption: Option<ConditionTickProperties> = null;

  triggeredWhenHitBy(actionName: CombatActionName) {
    const actionsThatTrigger = [
      CombatActionName.AttackMeleeMainhand,
      CombatActionName.AttackMeleeOffhand,
      CombatActionName.AttackRangedMainhandProjectile,
      CombatActionName.ExplodingArrowProjectile,
      CombatActionName.ChainingSplitArrowProjectile,
      CombatActionName.CounterattackMeleeMainhand,
      CombatActionName.CounterAttackRangedMainhandProjectile,
      CombatActionName.Explosion,
      CombatActionName.FirewallBurn,
      CombatActionName.Fire,
    ];
    return actionsThatTrigger.includes(actionName);
  }

  triggeredWhenActionUsed() {
    return false;
  }

  getAttributeModifiers = undefined;

  onTriggered(
    this: PrimedForIceBurstCombatantCondition,
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    const actionUser = this;

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
      CombatActionName.IceBurst
    ].targetingProperties.getAutoTarget(conditionUserContext, null);

    if (actionTarget instanceof Error) throw actionTarget;
    if (actionTarget === null) throw new Error("failed to get auto target");

    const actionExecutionIntent = new CombatActionExecutionIntent(
      CombatActionName.IceBurst,
      actionUser.getLevel(),
      actionTarget
    );

    return {
      numStacksRemoved: this.stacksOption.current,
      triggeredActions: [{ user: actionUser, actionExecutionIntent }],
    };
  }

  getCosmeticEffectWhileActive(combatantId: EntityId) {
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
  }
}
