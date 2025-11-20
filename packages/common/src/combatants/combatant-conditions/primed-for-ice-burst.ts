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
import { ActionUserContext } from "../../action-user-context/index.js";
import { ActionUserTargetingProperties } from "../../action-user-context/action-user-targeting-properties.js";
import { runIfInBrowser } from "../../utils/index.js";
import makeAutoObservable from "mobx-store-inheritance";

const getNewStacks = () => new MaxAndCurrent(1, 1);

export class PrimedForIceBurstCombatantCondition extends CombatantCondition {
  name = CombatantConditionName.PrimedForIceBurst;
  stacksOption = getNewStacks();
  intent = CombatActionIntent.Malicious;
  removedOnDeath: boolean = true;
  ticks?: MaxAndCurrent | undefined = undefined;
  constructor(
    public id: EntityId,
    appliedBy: ConditionAppliedBy,
    appliedTo: EntityId,
    public level: number
  ) {
    super(id, appliedBy, appliedTo, CombatantConditionName.PrimedForIceBurst, getNewStacks());
    this.targetingProperties = new ActionUserTargetingProperties();
    runIfInBrowser(() => makeAutoObservable(this));
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
      CombatActionName.ExecuteExplosion,
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
      CombatActionName.IceBurstParent
    ].targetingProperties.getAutoTarget(conditionUserContext, null);

    if (actionTarget instanceof Error) throw actionTarget;
    if (actionTarget === null) throw new Error("failed to get auto target");

    const actionExecutionIntent = new CombatActionExecutionIntent(
      CombatActionName.IceBurstParent,
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
