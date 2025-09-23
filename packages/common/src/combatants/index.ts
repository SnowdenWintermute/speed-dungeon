import { Quaternion, Vector3 } from "@babylonjs/core";
import { combatantHasRequiredAttributesToUseItem } from "./can-use-item.js";
import changeCombatantMana from "./resources/change-mana.js";
import { changeCombatantHitPoints } from "./resources/change-hit-points.js";
import { clampResourcesToMax } from "./resources/clamp-resources-to-max.js";
import { CombatantClass } from "./combatant-class/index.js";
import { CombatantSpecies } from "./combatant-species.js";
import { CombatantTraitType } from "./combatant-traits/index.js";
import dropEquippedItem from "./inventory/drop-equipped-item.js";
import dropItem from "./inventory/drop-item.js";
import { getCombatActionPropertiesIfOwned } from "./get-combat-action-properties.js";
import getCombatantTotalAttributes from "./attributes/get-combatant-total-attributes.js";
import getCombatantTotalElementalAffinities from "./combatant-traits/get-combatant-total-elemental-affinities.js";
import getCombatantTotalKineticDamageTypeAffinities from "./combatant-traits/get-combatant-total-kinetic-damage-type-affinities.js";
import { setResourcesToMax } from "./resources/set-resources-to-max.js";
import { immerable } from "immer";
import { iterateNumericEnum, iterateNumericEnumKeyedRecord } from "../utils/index.js";
import awardLevelups, { XP_REQUIRED_TO_REACH_LEVEL_2 } from "./experience-points/award-levelups.js";
import { incrementAttributePoint } from "./attributes/increment-attribute.js";
import { MonsterType } from "../monsters/monster-types.js";
import {
  CombatantEquipment,
  applyEquipmentEffectWhileMaintainingResourcePercentages,
  equipItem,
  getEquippedWeapon,
  getSlotItemIsEquippedTo,
  getWeaponsInSlots,
  unequipSlots,
} from "./combatant-equipment/index.js";
import { CombatAttribute } from "./attributes/index.js";
import { getOwnedEquipment } from "./inventory/get-owned-items.js";
import { EntityId, MaxAndCurrent } from "../primatives/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { canPickUpItem } from "./inventory/can-pick-up-item.js";
import { EntityProperties } from "../primatives/index.js";
import { Inventory } from "./inventory/index.js";
import {
  ActionPayableResource,
  CombatActionName,
  FriendOrFoe,
  getUnmetCostResourceTypes,
} from "../combat/combat-actions/index.js";
import { CombatantActionState } from "./owned-actions/combatant-action-state.js";
import { getActionNamesFilteredByUseableContext } from "./owned-actions/get-owned-action-names-filtered-by-usable-context.js";
import {
  COMBATANT_CONDITION_CONSTRUCTORS,
  CombatantCondition,
  ConditionAppliedBy,
  ConditionTickProperties,
} from "./combatant-conditions/index.js";
import { Equipment, EquipmentType, HoldableSlotType } from "../items/equipment/index.js";
import { plainToInstance } from "class-transformer";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import { ThreatManager } from "./threat-manager/index.js";
import { COMBATANT_MAX_ACTION_POINTS } from "../app-consts.js";
import { CombatantAbilityProperties } from "./combatant-abilities/combatant-ability-properties.js";
import { ActionEntity } from "../action-entities/index.js";
import cloneDeep from "lodash.clonedeep";
import { IActionUser } from "../combatant-context/action-user.js";
import {
  ActionAndRank,
  ActionUserTargetingProperties,
} from "../combatant-context/action-user-targeting-properties.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Battle } from "../battle/index.js";
import { TurnTrackerEntityType } from "../combat/turn-order/turn-tracker-tagged-tracked-entity-ids.js";

export enum AiType {
  Healer,
}

export * from "./combatant-class/index.js";
export * from "./combatant-species.js";
export * from "./combatant-traits/index.js";
export * from "./owned-actions/index.js";
export * from "./get-combat-action-properties.js";
export * from "./inventory/index.js";
export * from "./update-home-position.js";
export * from "./combatant-equipment/index.js";
export * from "./combatant-conditions/index.js";
export * from "./threat-manager/index.js";
export * from "./combatant-traits/index.js";
export * from "./ability-tree/index.js";
export * from "./combatant-abilities/index.js";
export * from "./attributes/index.js";

export class Combatant implements IActionUser {
  [immerable] = true;
  constructor(
    public entityProperties: EntityProperties,
    public combatantProperties: CombatantProperties
  ) {}
  getConditionTickPropertiesOption(): null | ConditionTickProperties {
    throw new Error("getCombatantPropertiesOption() is invalid on Combatants.");
  }
  getConditionAppliedTo(): EntityId {
    throw new Error("getConditionAppliedTo() not valid on a combatant");
  }

  getCombatantProperties(): CombatantProperties {
    return this.combatantProperties;
  }

  getConditionStacks(): MaxAndCurrent {
    throw new Error("Only conditions have stacks");
  }
  getEntityProperties(): EntityProperties {
    return this.entityProperties;
  }
  getName(): string {
    return this.entityProperties.name;
  }
  getPosition() {
    return this.combatantProperties.position;
  }
  getHomePosition() {
    return this.combatantProperties.homeLocation;
  }
  getHomeRotation() {
    return this.combatantProperties.homeRotation;
  }
  getConditionAppliedBy(): ConditionAppliedBy {
    throw new Error("getConditionAppliedBy() is only valid on CombatantCondition");
  }
  getAllyAndOpponentIds(): Record<FriendOrFoe, EntityId[]> {
    throw new Error("Method not implemented.");
  }
  getTargetingProperties = () => this.combatantProperties.targetingProperties;
  payResourceCosts(): void {
    throw new Error("Method not implemented.");
  }
  handleTurnEnded(): void {
    throw new Error("Method not implemented.");
  }
  getEntityId(): EntityId {
    return this.entityProperties.id;
  }
  getLevel(): number {
    return this.combatantProperties.level;
  }
  getTotalAttributes(): CombatantAttributeRecord {
    return CombatantProperties.getTotalAttributes(this.combatantProperties);
  }
  getOwnedAbilities(): Partial<Record<CombatActionName, CombatantActionState>> {
    return this.combatantProperties.abilityProperties.ownedActions;
  }
  getEquipmentOption() {
    return this.combatantProperties.equipment;
  }
  getInventoryOption(): null | Inventory {
    return this.combatantProperties.inventory;
  }
  getIdOfEntityToCreditWithThreat(): EntityId {
    return this.entityProperties.id;
  }

  static rehydrate(combatant: Combatant) {
    const { combatantProperties } = combatant;

    CombatantProperties.instantiateItemClasses(combatantProperties);

    const rehydratedConditions = combatantProperties.conditions.map((condition) => {
      const constructor = COMBATANT_CONDITION_CONSTRUCTORS[condition.name];
      return plainToInstance(constructor, condition);
    });

    combatantProperties.conditions = rehydratedConditions;

    if (combatantProperties.threatManager)
      combatantProperties.threatManager = plainToInstance(
        ThreatManager,
        combatantProperties.threatManager
      );
  }

  canUseAction(
    targets: CombatActionTarget,
    actionAndRank: ActionAndRank,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Error | void {
    const { combatantProperties } = this;
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];

    if (action.costProperties.getMeetsCustomRequirements) {
      const { meetsRequirements, reasonDoesNot } = action.costProperties.getMeetsCustomRequirements(
        this,
        rank
      );
      if (!meetsRequirements) return new Error(reasonDoesNot);
    }

    const combatActionPropertiesResult = getCombatActionPropertiesIfOwned(
      this.combatantProperties,
      actionAndRank
    );
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;

    const actionStateOption = combatantProperties.abilityProperties.ownedActions[action.name];
    if (actionStateOption && actionStateOption.cooldown && actionStateOption.cooldown.current)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.IS_ON_COOLDOWN);

    const hasRequiredConsumables = CombatantProperties.hasRequiredConsumablesToUseAction(
      this,
      action.name
    );
    if (!hasRequiredConsumables) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);

    const hasRequiredResources = CombatantProperties.hasRequiredResourcesToUseAction(
      this,
      actionAndRank,
      !!AdventuringParty.getBattleOption(party, game)
    );

    if (!hasRequiredResources)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);

    const isWearingRequiredEquipment = CombatantProperties.isWearingRequiredEquipmentToUseAction(
      combatantProperties,
      actionAndRank
    );
    if (!isWearingRequiredEquipment)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_WEARING_REQUIRED_EQUIPMENT);

    // IF IN BATTLE, ONLY USE IF FIRST IN TURN ORDER
    let battleOption: null | Battle = null;
    if (party.battleId !== null) {
      const battle = game.battles[party.battleId];
      if (battle !== undefined) battleOption = battle;
      else return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    }

    if (battleOption !== null) {
      const fastestActor = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
      const taggedTrackedEntityId = fastestActor.getTaggedIdOfTrackedEntity();
      if (taggedTrackedEntityId.type !== TurnTrackerEntityType.Combatant)
        return new Error("expected a combatant to be first in turn order");
      if (taggedTrackedEntityId.combatantId !== this.entityProperties.id) {
        const message = `${ERROR_MESSAGES.COMBATANT.NOT_ACTIVE} first turn tracker ${JSON.stringify(fastestActor)}`;
        return new Error(message);
      }
    }

    const isInUsableContext = action.isUsableInThisContext(battleOption);
    if (!isInUsableContext)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_USABILITY_CONTEXT);

    // @TODO - TARGETS ARE NOT IN A PROHIBITED STATE
    // action would only make sense if we didn't already check valid states when targeting... unless
    // target state could change while they are already targeted, like if someone healed themselves
    // to full hp while someone else was targeting them with an autoinjector
  }
}

export interface SupportClassProperties {
  level: number;
  combatantClass: CombatantClass;
}

export class CombatantProperties {
  [immerable] = true;

  supportClassProperties: null | SupportClassProperties = null;

  level: number = 1;
  experiencePoints: ExperiencePoints = {
    current: 0,
    requiredForNextLevel: XP_REQUIRED_TO_REACH_LEVEL_2,
  };

  // ATTRIBUTES
  inherentAttributes: CombatantAttributeRecord = {};
  speccedAttributes: CombatantAttributeRecord = {};
  unspentAttributePoints: number = 0;

  hitPoints: number = 0;
  mana: number = 0;
  actionPoints: number = 0;

  // ABILITIES
  abilityProperties = new CombatantAbilityProperties();

  // ITEMS
  equipment: CombatantEquipment = new CombatantEquipment();
  inventory: Inventory = new Inventory();
  // TARGETING
  targetingProperties: ActionUserTargetingProperties = new ActionUserTargetingProperties();
  // THREAT
  threatManager?: ThreatManager;
  // UNSORTED
  deepestFloorReached: number = 1;
  position: Vector3;
  conditions: CombatantCondition[] = [];
  asShimmedUserOfTriggeredCondition?: {
    condition: CombatantCondition;
    entityConditionWasAppliedTo: EntityId;
  };
  asShimmedActionEntity?: ActionEntity;

  aiTypes?: AiType[];

  public homeRotation: Quaternion = Quaternion.Zero();
  constructor(
    public combatantClass: CombatantClass,
    public combatantSpecies: CombatantSpecies,
    public monsterType: null | MonsterType,
    /** We use the player name, even though it can change, because using the ownerId (snowauth id)
     * would expose it to the client. The tradeoff is a player can not change their username mid game without
     * forfeiting control of their characters. In practice, we ask their client to reconnect all sockets anyway
     * after a username change.
     * */
    public controllingPlayer: null | string,
    public homeLocation: Vector3
  ) {
    this.position = homeLocation;
    // this.ownedActions[CombatActionName.Attack] = new CombatantActionState(CombatActionName.Attack);
  }

  static meetsCombatantClassAndLevelRequirements(
    combatantProperties: CombatantProperties,
    combatantClass: CombatantClass,
    level: number
  ) {
    const { supportClassProperties } = combatantProperties;
    const supportClassMeetsRequirements =
      supportClassProperties?.combatantClass === combatantClass &&
      supportClassProperties.level >= level;
    const mainClassMeetsRequirements =
      combatantProperties.combatantClass === combatantClass && combatantProperties.level >= level;
    return supportClassMeetsRequirements || mainClassMeetsRequirements;
  }

  static getConditionById(combatantProperties: CombatantProperties, conditionId: EntityId) {
    for (const condition of combatantProperties.conditions) {
      if (condition.id === conditionId) return condition;
    }
    return null;
  }

  static getCombatActionPropertiesIfOwned = getCombatActionPropertiesIfOwned;
  static getTotalAttributes = getCombatantTotalAttributes;
  static getCombatantTotalElementalAffinities = getCombatantTotalElementalAffinities;
  static getCombatantTotalKineticDamageTypeAffinities =
    getCombatantTotalKineticDamageTypeAffinities;
  static getEquippedWeapon = getEquippedWeapon;
  static getWeaponsInSlots = getWeaponsInSlots;
  static getActionNamesFilteredByUseableContext = getActionNamesFilteredByUseableContext;
  static getSlotItemIsEquippedTo = getSlotItemIsEquippedTo;
  static getOwnedEquipment = getOwnedEquipment;
  static getOwnedItemById(combatantProperties: CombatantProperties, itemId: EntityId) {
    const ownedEquipment = CombatantProperties.getOwnedEquipment(combatantProperties);
    for (const equipment of ownedEquipment) {
      if (equipment.entityProperties.id === itemId) return equipment;
    }
    const items = Inventory.getItems(combatantProperties.inventory);
    for (const item of items) {
      if (item.entityProperties.id === itemId) return item;
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  static removeOwnedItem(combatantProperties: CombatantProperties, itemId: EntityId) {
    let removedItemResult = Inventory.removeItem(combatantProperties.inventory, itemId);

    if (removedItemResult instanceof Error) {
      applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
        removedItemResult = CombatantEquipment.removeItem(combatantProperties.equipment, itemId);
      });
    }
    return removedItemResult;
  }

  static changeHitPoints = changeCombatantHitPoints;
  static changeMana = changeCombatantMana;
  static changeActionPoints(combatantProperties: CombatantProperties, value: number) {
    combatantProperties.actionPoints = Math.min(
      COMBATANT_MAX_ACTION_POINTS,
      Math.max(0, combatantProperties.actionPoints + value)
    );
  }
  static clampHpAndMpToMax = clampResourcesToMax;
  static setHpAndMpToMax = setResourcesToMax;
  static refillActionPoints(combatantProperties: CombatantProperties) {
    combatantProperties.actionPoints = COMBATANT_MAX_ACTION_POINTS;
  }
  static tickCooldowns(combatantProperties: CombatantProperties) {
    for (const [actionName, actionState] of iterateNumericEnumKeyedRecord(
      combatantProperties.abilityProperties.ownedActions
    )) {
      if (actionState.wasUsedThisTurn) {
        actionState.wasUsedThisTurn = false;
      } else if (actionState.cooldown && actionState.cooldown.current) {
        actionState.cooldown.current -= 1;
      }
    }
  }
  static payResourceCosts(
    combatantProperties: CombatantProperties,
    costs: Partial<Record<ActionPayableResource, number>>
  ) {
    for (const [resource, cost] of iterateNumericEnumKeyedRecord(costs)) {
      switch (resource) {
        case ActionPayableResource.HitPoints:
          CombatantProperties.changeHitPoints(combatantProperties, cost);
          break;
        case ActionPayableResource.Mana:
          CombatantProperties.changeMana(combatantProperties, cost);
          break;
        case ActionPayableResource.Shards:
          break;
        case ActionPayableResource.ActionPoints:
          CombatantProperties.changeActionPoints(combatantProperties, cost);
          break;
      }
    }
  }
  static isDead(combatantProperties: CombatantProperties) {
    return combatantProperties.hitPoints <= 0;
  }
  static unequipSlots = unequipSlots;
  static dropItem = dropItem;
  static dropEquippedItem = dropEquippedItem;
  static combatantHasRequiredAttributesToUseItem = combatantHasRequiredAttributesToUseItem;
  static equipItem = equipItem;
  static awardLevelups = awardLevelups;
  static incrementAttributePoint = incrementAttributePoint;
  static canPickUpItem = canPickUpItem;
  static instantiateItemClasses(combatantProperties: CombatantProperties) {
    Inventory.instantiateItemClasses(combatantProperties.inventory);
    CombatantEquipment.instatiateItemClasses(combatantProperties.equipment);
  }

  static canParry(combatantProperties: CombatantProperties): boolean {
    const holdables = CombatantEquipment.getEquippedHoldableSlots(combatantProperties.equipment);
    if (!holdables) return false;
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.OffHand) continue;
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (
        equipmentType === EquipmentType.OneHandedMeleeWeapon ||
        equipmentType === EquipmentType.TwoHandedMeleeWeapon
      )
        return true;
    }
    return false;
  }

  static canCounterattack(combatantProperties: CombatantProperties): boolean {
    return true;
  }

  static canBlock(combatantProperties: CombatantProperties): boolean {
    const holdables = CombatantEquipment.getEquippedHoldableSlots(combatantProperties.equipment);
    if (!holdables) return false;
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.MainHand) continue;
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (equipmentType === EquipmentType.Shield && !Equipment.isBroken(equipment)) return true;
    }
    return false;
  }

  static hasTraitType(combatantProperties: CombatantProperties, traitType: CombatantTraitType) {
    const { traitProperties } = combatantProperties.abilityProperties;
    return (
      !!traitProperties.inherentTraitLevels[traitType] ||
      !!traitProperties.speccedTraitLevels[traitType]
    );
  }

  static hasRequiredConsumablesToUseAction(actionUser: IActionUser, actionName: CombatActionName) {
    const action = COMBAT_ACTIONS[actionName];
    const consumableCost = action.costProperties.getConsumableCost(actionUser);
    if (consumableCost !== null) {
      const inventory = actionUser.getInventoryOption();
      if (inventory === null) throw new Error("expected user to have an inventory");
      const { type, level } = consumableCost;
      const consumableOption = Inventory.getConsumableByTypeAndLevel(inventory, type, level);
      if (consumableOption === undefined) return false;
    }
    return true;
  }

  static hasRequiredResourcesToUseAction(
    actionUser: IActionUser,
    actionAndRank: ActionAndRank,
    isInCombat: boolean
  ) {
    const { actionName, rank } = actionAndRank;

    const action = COMBAT_ACTIONS[actionName];
    const costs = action.costProperties.getResourceCosts(actionUser, isInCombat, rank);

    if (costs) {
      const unmetCosts = getUnmetCostResourceTypes(actionUser.getCombatantProperties(), costs);
      if (unmetCosts.length) return false;
    }
    return true;
  }

  static isWearingRequiredEquipmentToUseAction(
    combatantProperties: CombatantProperties,
    actionAndRank: ActionAndRank
  ) {
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];
    const { getRequiredEquipmentTypeOptions } = action.targetingProperties;
    if (getRequiredEquipmentTypeOptions(rank).length === 0) return true;

    const allEquipment = CombatantEquipment.getAllEquippedItems(combatantProperties.equipment, {
      includeUnselectedHotswapSlots: false,
    });
    for (const equipment of allEquipment) {
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (Equipment.isBroken(equipment)) continue;
      if (getRequiredEquipmentTypeOptions(rank).includes(equipmentType)) return true;
    }
    return false;
  }

  static changeSupportClassLevel(
    combatantProperties: CombatantProperties,
    supportClass: CombatantClass,
    value: number
  ) {
    applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
      const { supportClassProperties } = combatantProperties;

      if (supportClassProperties !== null) {
        supportClassProperties.level += value;
      } else {
        combatantProperties.supportClassProperties = { combatantClass: supportClass, level: value };
      }

      combatantProperties.abilityProperties.unspentAbilityPoints += 1;
    });
  }
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;

/* Since combat actions must have a user, and the user of an action triggered by
 * a condition is not well defined, we'll create a placeholder */
export function createShimmedUserOfTriggeredCondition(
  name: string,
  condition: CombatantCondition,
  entityConditionWasAppliedTo: EntityId
) {
  const combatant = new Combatant(
    // use the entity id of the condition applied to since the appliedBy entity may
    // no longer exist
    { id: entityConditionWasAppliedTo || "0", name },
    new CombatantProperties(
      CombatantClass.Mage,
      CombatantSpecies.Dragon,
      null,
      null,
      Vector3.Zero()
    )
  );

  iterateNumericEnum(CombatActionName).forEach((actionName) => {
    combatant.combatantProperties.abilityProperties.ownedActions[actionName] =
      new CombatantActionState(actionName, 1);
  });

  combatant.combatantProperties.asShimmedUserOfTriggeredCondition = {
    condition,
    entityConditionWasAppliedTo,
  };
  return combatant;
}

/* see createShimmedUserOfTriggeredCondition */
export function createShimmedUserOfActionEntityAction(
  name: string,
  actionEntity: ActionEntity,
  primaryTargetId: EntityId // not sure why we're making shimmed user ids their target id
) {
  const combatant = new Combatant(
    { id: primaryTargetId || "0", name },
    new CombatantProperties(
      CombatantClass.Mage,
      CombatantSpecies.Dragon,
      null,
      null,
      Vector3.Zero()
    )
  );

  iterateNumericEnum(CombatActionName).forEach((actionName) => {
    combatant.combatantProperties.abilityProperties.ownedActions[actionName] =
      new CombatantActionState(actionName, 1);
  });

  combatant.combatantProperties.asShimmedActionEntity = actionEntity;

  return combatant;
}

// Take a snapshot of the projectile user's status at the moment of use
// so we can modify their hit outcome relevant stats if the projectile goes
// through a firewall on the way
export function createCopyOfProjectileUser(combatant: Combatant, actionEntity: ActionEntity) {
  // @PERF - don't need to clone their entire inventory, just hotswap slots, equipped items
  // and attributes and traits
  const copied = cloneDeep(combatant);

  copied.combatantProperties.asShimmedActionEntity = actionEntity;

  return copied;
}
