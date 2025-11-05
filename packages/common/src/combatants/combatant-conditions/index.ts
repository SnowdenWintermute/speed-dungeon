import { Option } from "../../primatives/index.js";
import { Battle } from "../../battle/index.js";
import { CombatActionIntent } from "../../combat/combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CosmeticEffectOnTargetTransformNode } from "../../combat/combat-actions/combat-action-steps-config.js";
import { FriendOrFoe } from "../../combat/combat-actions/targeting-schemes-and-categories.js";
import { EntityId, EntityProperties, MaxAndCurrent } from "../../primatives/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { Combatant, CombatantAttributeRecord, ConditionTickProperties } from "../index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { ActionUserType, IActionUser } from "../../action-user-context/action-user.js";
import { ActionIntentAndUser } from "../../action-processing/index.js";
import { ActionUserTargetingProperties } from "../../action-user-context/action-user-targeting-properties.js";
import { Vector3, Quaternion } from "@babylonjs/core";
import { ActionEntityProperties } from "../../action-entities/index.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { CombatantProperties } from "../combatant-properties.js";
export * from "./condition-tick-properties.js";

export enum CombatantConditionName {
  // Poison,
  PrimedForExplosion,
  PrimedForIceBurst,
  Burning,
  Blinded,
}

export const COMBATANT_CONDITION_NAME_STRINGS: Record<CombatantConditionName, string> = {
  // [CombatantConditionName.Poison]: "Poison",
  [CombatantConditionName.PrimedForExplosion]: "Detonatable",
  [CombatantConditionName.PrimedForIceBurst]: "Shatterable",
  [CombatantConditionName.Burning]: "Burning",
  [CombatantConditionName.Blinded]: "Blinded",
};

export const COMBATANT_CONDITION_DESCRIPTIONS: Record<CombatantConditionName, string> = {
  // [CombatantConditionName.Poison]: "Periodically takes damage",
  [CombatantConditionName.PrimedForExplosion]: "Causes an explosion when hit by certain actions",
  [CombatantConditionName.PrimedForIceBurst]: "Causes an ice burst when hit by certain actions",
  [CombatantConditionName.Burning]: "Periodically takes non-magical fire damage",
  [CombatantConditionName.Blinded]: "Accuracy is reduced",
};

export const MAX_CONDITION_STACKS = 99;

export interface ConditionAppliedBy {
  entityProperties: EntityProperties;
  // we store this because at the time a condition is triggered,
  // the entity which originally applied the condition may no longer exist
  // yet we still must figure out the target ids of the condition's triggered
  // action based on its intent and friend or foe status of targets
  // where normally we would just calculate that based off a condition user's
  // presence in a certain battle group relative to the target's battle group
  friendOrFoe: FriendOrFoe;
}

export interface ConditionWithCombatantIdAppliedTo {
  condition: CombatantCondition;
  appliedTo: EntityId;
}

export abstract class CombatantCondition implements IActionUser {
  ticks?: MaxAndCurrent;
  level: number = 1;
  intent: CombatActionIntent = CombatActionIntent.Malicious;
  removedOnDeath: boolean = true;
  combatAttributes?: CombatantAttributeRecord = {};
  // @PERF - don't use targeting properties on conditions that don't have targets
  targetingProperties: ActionUserTargetingProperties = new ActionUserTargetingProperties();
  constructor(
    public id: EntityId,
    public appliedBy: ConditionAppliedBy,
    public appliedTo: EntityId,
    public name: CombatantConditionName,
    public stacksOption: null | MaxAndCurrent
  ) {}
  getType = () => ActionUserType.Condition;
  getActionEntityProperties(): ActionEntityProperties {
    throw new Error("Conditions do not have ActionEntityProperties.");
  }
  wasRemovedBeforeHitOutcomes(): boolean {
    return false;
  }

  setWasRemovedBeforeHitOutcomes(): void {}
  getConditionTickPropertiesOption() {
    return this.tickPropertiesOption;
  }
  getConditionAppliedTo(): EntityId {
    return this.appliedTo;
  }

  getCombatantProperties(): CombatantProperties {
    throw new Error("Conditions do not have combatantProperties");
  }

  getConditionStacks(): MaxAndCurrent {
    return this.stacksOption || new MaxAndCurrent(0, 0);
  }
  getEntityProperties(): EntityProperties {
    return { id: this.id, name: this.getName() };
  }
  getName(): string {
    return COMBATANT_CONDITION_NAME_STRINGS[this.name];
  }
  getPositionOption() {
    return null;
  }
  getMovementSpeedOption(): null | number {
    return null;
  }

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
    if (this.targetingProperties) return this.targetingProperties;
    throw new Error("Condition was not configured with targetingProperties");
  }
  payResourceCosts = () => {};
  handleTurnEnded = () => {};
  getEntityId = () => this.id;
  getLevel = () => this.level;
  getTotalAttributes = () => this.combatAttributes || {};
  getOwnedAbilities() {
    return {};
  }
  getEquipmentOption = () => null;
  getInventoryOption = () => null;
  getIdOfEntityToCreditWithThreat = () => this.appliedBy.entityProperties.id;

  hasRequiredAttributesToUseItem(): boolean {
    return true;
  }

  hasRequiredConsumablesToUseAction(): boolean {
    return true;
  }

  getWeaponsInSlots() {
    return {};
  }

  abstract triggeredWhenHitBy(actionName: CombatActionName): boolean;

  abstract triggeredWhenActionUsed(): boolean;

  abstract onTriggered(
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ): {
    numStacksRemoved: number;
    triggeredActions: ActionIntentAndUser[];
  };

  abstract getCosmeticEffectWhileActive(
    combatantId: EntityId
  ): CosmeticEffectOnTargetTransformNode[];

  abstract tickPropertiesOption: Option<ConditionTickProperties>;

  abstract getAttributeModifiers?(
    condition: CombatantCondition,
    appliedTo: CombatantProperties
  ): CombatantAttributeRecord;

  getTickProperties() {
    return this.tickPropertiesOption;
  }
}
