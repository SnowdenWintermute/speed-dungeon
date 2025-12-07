import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { EntityId, MaxAndCurrent } from "../primatives/index.js";
import { EntityProperties } from "../primatives/entity-properties.js";
import { CombatActionIntent } from "../combat/combat-actions/combat-action-intent.js";
import { CombatantAttributeRecord } from "../combatants/combatant-attribute-record.js";
import {
  ActionEntityProperties,
  ActionIntentAndUser,
  ActionUserContext,
  ActionUserTargetingProperties,
  ActionUserType,
  AdventuringParty,
  AiType,
  Battle,
  CombatActionName,
  Combatant,
  COMBATANT_CONDITION_DESCRIPTIONS,
  CombatantProperties,
  ConditionTickProperties,
  CosmeticEffectOnTargetTransformNode,
  IActionUser,
  IdGenerator,
  TransformModifiers,
} from "../index.js";
import { COMBATANT_CONDITION_NAME_STRINGS, CombatantConditionName } from "./condition-names.js";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { ConditionAppliedBy } from "./condition-applied-by.js";
import { CombatantConditionConfig, CombatantConditionInit } from "./condition-config.js";

export const MAX_CONDITION_STACKS = 99;

export interface ConditionWithCombatantIdAppliedTo {
  condition: CombatantCondition;
  appliedTo: EntityId;
}

export class CombatantCondition implements IActionUser {
  public name: CombatantConditionName;
  public rank: number;
  public id: EntityId;
  public appliedBy: ConditionAppliedBy;
  public appliedTo: EntityId;
  public intent: CombatActionIntent;
  public stacksOption?: MaxAndCurrent;
  public removedOnDeath?: boolean;
  public triggeredWhenHitBy?: CombatActionName[];
  public triggeredWhenActionUsed?: CombatActionName[];
  /** As action user, this condition's attributes */
  public combatAttributes?: CombatantAttributeRecord;
  public targetingProperties?: ActionUserTargetingProperties;

  private tickPropertiesOption?: ConditionTickProperties;

  getAiTypesAppliedToTarget: () => AiType[];
  getConditionAppliedTo: () => EntityId;
  getDescription = () => `${COMBATANT_CONDITION_DESCRIPTIONS[this.name]} (rank ${this.rank})`;
  onTriggered(
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ): {
    numStacksRemoved: number;
    triggeredActions: ActionIntentAndUser[];
  } {
    return { numStacksRemoved: 0, triggeredActions: [] };
  }

  getCosmeticEffectWhileActive?(combatantId: EntityId): CosmeticEffectOnTargetTransformNode[];

  /** How this condition affects the appliedTo combatant */
  getAttributeModifiers?(appliedTo: CombatantProperties): CombatantAttributeRecord;

  getTransformModifiers(): TransformModifiers {
    return {};
  }

  getTickProperties() {
    return this.tickPropertiesOption;
  }

  constructor(config: CombatantConditionConfig) {
    this.name = config.name;
    this.rank = config.rank;
    this.id = config.id;
    this.appliedBy = config.appliedBy;
    this.appliedTo = config.appliedTo;
    this.intent = config.intent;
    this.stacksOption = config.stacksOption;
    this.tickPropertiesOption = config.tickPropertiesOption;
    this.removedOnDeath = config.removedOnDeath;
    this.triggeredWhenHitBy = config.triggeredWhenHitBy;
    this.combatAttributes = config.combatAttributes;

    this.getAiTypesAppliedToTarget = () => config.getAiTypesAppliedToTarget?.(this) || [];
    this.getConditionAppliedTo = () => config.appliedTo;

    const onTriggeredOverride = config.onTriggered;
    if (onTriggeredOverride) {
      this.onTriggered = (actionUserContext, combatantAppliedTo, idGenerator) =>
        onTriggeredOverride(this, actionUserContext, combatantAppliedTo, idGenerator);
    }

    const cosmeticEffectWhileActiveGetterOverride = config.getCosmeticEffectWhileActive;
    if (cosmeticEffectWhileActiveGetterOverride) {
      this.getCosmeticEffectWhileActive = (appliedTo) =>
        cosmeticEffectWhileActiveGetterOverride(this, appliedTo);
    }

    const attributeModifiersGetterOverride = config.getAttributeModifiers;
    if (attributeModifiersGetterOverride) {
      this.getAttributeModifiers = (combatantAppliedTo) =>
        attributeModifiersGetterOverride(this, combatantAppliedTo);
    }

    const transformModifiersGetterOverride = config.getTransformModifiers;
    if (transformModifiersGetterOverride) {
      this.getTransformModifiers = () => transformModifiersGetterOverride();
    }

    const descriptionGetterOverride = config.getDescription;
    if (descriptionGetterOverride) {
      this.getDescription = () => descriptionGetterOverride(this);
    }
  }

  static getInit(condition: CombatantCondition): CombatantConditionInit {
    return {
      name: condition.name,
      rank: condition.rank,
      id: condition.id,
      appliedBy: condition.appliedBy,
      appliedTo: condition.appliedTo,
      stacks: condition.stacksOption?.current || null,
    };
  }

  getStringName() {
    return COMBATANT_CONDITION_NAME_STRINGS[this.name];
  }

  getType = () => ActionUserType.Condition;
  getActionEntityProperties(): ActionEntityProperties {
    throw new Error("Conditions do not have ActionEntityProperties.");
  }
  wasRemovedBeforeHitOutcomes = () => false;
  setWasRemovedBeforeHitOutcomes(): void {}
  getConditionTickPropertiesOption = () => this.tickPropertiesOption || null;

  getCombatantProperties(): CombatantProperties {
    throw new Error("Conditions do not have combatantProperties");
  }

  getConditionStacks(): MaxAndCurrent {
    return this.stacksOption || new MaxAndCurrent(0, 0);
  }

  getEntityProperties(): EntityProperties {
    return { id: this.id, name: this.getName() };
  }
  getName = () => COMBATANT_CONDITION_NAME_STRINGS[this.name];
  getPositionOption = () => null;
  getMovementSpeedOption = () => null;
  getHomePosition(): Vector3 {
    throw new Error("Conditions do not have a home position");
  }
  getHomeRotation(): Quaternion {
    throw new Error("Conditions do not have a home rotation");
  }
  getConditionAppliedBy(): ConditionAppliedBy {
    return this.appliedBy;
  }

  getAllyAndOpponentIds(
    party: AdventuringParty,
    battleOption: null | Battle
  ): Record<FriendOrFoe, EntityId[]> {
    // @TODO - replace this placeholder
    if (!battleOption) {
      return { [FriendOrFoe.Hostile]: [], [FriendOrFoe.Friendly]: [] };
    }

    const idsByDispositionOfConditionHolder = party.combatantManager.getCombatantIdsByDisposition(
      this.appliedTo
    );

    switch (this.appliedBy.friendOrFoe) {
      case FriendOrFoe.Friendly:
        // if applied by a friendly combatant, "ally ids" would be the allies of conditionAppliedTo
        return idsByDispositionOfConditionHolder;
      case FriendOrFoe.Hostile:
        // if applied by a hostile combatant, "ally ids" would be the opponents of conditionAppliedTo
        return Battle.invertAllyAndOpponentIds(idsByDispositionOfConditionHolder);
    }
  }

  getTargetingProperties(): ActionUserTargetingProperties {
    if (!this.targetingProperties) {
      this.targetingProperties = new ActionUserTargetingProperties();
    }

    if (this.targetingProperties) {
      return this.targetingProperties;
    }

    throw new Error("Condition was not configured with targetingProperties");
  }

  payResourceCosts = () => {};
  handleTurnEnded = () => {};
  getEntityId = () => this.id;
  getLevel = () => this.rank;
  getTotalAttributes = () => this.combatAttributes || {};
  getOwnedActions = () => new Map();
  getEquipmentOption = () => null;
  getInventoryOption = () => null;
  getIdOfEntityToCreditWithThreat = () => this.appliedBy.entityProperties.id;
  hasRequiredAttributesToUseItem = () => true;
  hasRequiredConsumablesToUseAction = () => true;
  targetFlyingConditionPreventsReachingMeleeRange = () => false;
  actionAndRankMeetsUseRequirements(): { canUse: boolean; reasonCanNot?: string } {
    throw new Error("not implemented on conditions");
  }
  getWeaponsInSlots() {
    return {};
  }
  getNaturalUnarmedWeapons() {
    return {};
  }
}
