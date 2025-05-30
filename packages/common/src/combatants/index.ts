import { Quaternion, Vector3 } from "@babylonjs/core";
import { MagicalElement } from "../combat/magical-elements.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import combatantCanUseItem from "./can-use-item.js";
import changeCombatantMana from "./resources/change-mana.js";
import changeCombatantHitPoints from "./resources/change-hit-points.js";
import clampResourcesToMax from "./resources/clamp-resources-to-max.js";
import { CombatantClass } from "./combatant-class/index.js";
import { CombatantSpecies } from "./combatant-species.js";
import { CombatantTrait, CombatantTraitType } from "./combatant-traits/index.js";
import dropEquippedItem from "./inventory/drop-equipped-item.js";
import dropItem from "./inventory/drop-item.js";
import { getCombatActionPropertiesIfOwned } from "./get-combat-action-properties.js";
import getCombatantTotalAttributes from "./attributes/get-combatant-total-attributes.js";
import getCombatantTotalElementalAffinities from "./combatant-traits/get-combatant-total-elemental-affinities.js";
import getCombatantTotalKineticDamageTypeAffinities from "./combatant-traits/get-combatant-total-kinetic-damage-type-affinities.js";
import setResourcesToMax from "./resources/set-resources-to-max.js";
import { immerable } from "immer";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import awardLevelups, { XP_REQUIRED_TO_REACH_LEVEL_2 } from "./experience-points/award-levelups.js";
import { incrementAttributePoint } from "./attributes/increment-attribute.js";
import { MonsterType } from "../monsters/monster-types.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import {
  CombatantEquipment,
  equipItem,
  getEquippedWeapon,
  getSlotItemIsEquippedTo,
  getWeaponsInSlots,
  unequipSlots,
} from "./combatant-equipment/index.js";
import { CombatAttribute } from "./attributes/index.js";
import { getOwnedEquipment } from "./inventory/get-owned-items.js";
import { EntityId, Percentage } from "../primatives/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { canPickUpItem } from "./inventory/can-pick-up-item.js";
import { EntityProperties } from "../primatives/index.js";
import { Inventory } from "./inventory/index.js";
import { CombatActionName } from "../combat/combat-actions/index.js";
import { CombatantActionState } from "./owned-actions/combatant-action-state.js";
import { getOwnedActionState } from "./owned-actions/get-owned-action-state.js";
import { getAllCurrentlyUsableActionNames } from "./owned-actions/get-all-currently-usable-action-names.js";
import { getActionNamesFilteredByUseableContext } from "./owned-actions/get-owned-action-names-filtered-by-usable-context.js";
import { CombatantCondition } from "./combatant-conditions/index.js";
import { Equipment, EquipmentType, HoldableSlotType } from "../items/equipment/index.js";

export * from "./combatant-class/index.js";
export * from "./combatant-species.js";
export * from "./combatant-traits/index.js";
export * from "./owned-actions/index.js";
export * from "./get-combat-action-properties.js";
export * from "./inventory/index.js";
export * from "./update-home-position.js";
export * from "./combatant-equipment/index.js";
export * from "./combatant-conditions/index.js";

export class Combatant {
  [immerable] = true;
  constructor(
    public entityProperties: EntityProperties,
    public combatantProperties: CombatantProperties
  ) {}
}

export class CombatantProperties {
  [immerable] = true;
  inherentAttributes: CombatantAttributeRecord = {};
  inherentElementalAffinities: Partial<Record<MagicalElement, Percentage>> = {};
  inherentKineticDamageTypeAffinities: Partial<Record<KineticDamageType, Percentage>> = {};
  level: number = 1;
  unspentAttributePoints: number = 0;
  unspentAbilityPoints: number = 0;
  hitPoints: number = 0;
  mana: number = 0;
  speccedAttributes: CombatantAttributeRecord = {};
  experiencePoints: ExperiencePoints = {
    current: 0,
    requiredForNextLevel: XP_REQUIRED_TO_REACH_LEVEL_2,
  };
  ownedActions: Partial<Record<CombatActionName, CombatantActionState>> = {};
  traits: CombatantTrait[] = [];
  equipment: CombatantEquipment = new CombatantEquipment();
  inventory: Inventory = new Inventory();
  selectedCombatAction: null | CombatActionName = null;
  combatActionTarget: null | CombatActionTarget = null;
  deepestFloorReached: number = 1;
  position: Vector3;
  conditions: CombatantCondition[] = [];
  asUserOfTriggeredCondition?: CombatantCondition;
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
    this.ownedActions[CombatActionName.Attack] = new CombatantActionState(CombatActionName.Attack);
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
  static getOwnedActionState = getOwnedActionState;
  static changeHitPoints = changeCombatantHitPoints;
  static changeMana = changeCombatantMana;
  static clampHpAndMpToMax = clampResourcesToMax;
  static setHpAndMpToMax = setResourcesToMax;
  static unequipSlots = unequipSlots;
  static dropItem = dropItem;
  static dropEquippedItem = dropEquippedItem;
  static canUseItem = combatantCanUseItem;
  static equipItem = equipItem;
  static awardLevelups = awardLevelups;
  static incrementAttributePoint = incrementAttributePoint;
  static canPickUpItem = canPickUpItem;
  static instantiateItemClasses(combatantProperties: CombatantProperties) {
    Inventory.instantiateItemClasses(combatantProperties.inventory);
    CombatantEquipment.instatiateItemClasses(combatantProperties);
  }
  static getAllCurrentlyUsableActionNames = getAllCurrentlyUsableActionNames;

  static canParry(combatantProperties: CombatantProperties): boolean {
    const holdables = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
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
    const holdables = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
    if (!holdables) return false;
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.MainHand) continue;
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (equipmentType === EquipmentType.Shield && !Equipment.isBroken(equipment)) return true;
    }
    return false;
  }

  static hasTraitType(combatantProperties: CombatantProperties, traitType: CombatantTraitType) {
    let hasTrait = false;
    for (const trait of combatantProperties.traits) {
      if (trait.type === traitType) {
        hasTrait = true;
        break;
      }
    }
    return hasTrait;
  }

  static getForward(combatantProperties: CombatantProperties) {
    // const { x, y, z } = combatantProperties.homeLocation;
    // return cloneVector3(new Vector3(x, 0, 0)).subtract(combatantProperties.homeLocation);
    return new Vector3(0, 0, 1);
  }
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;

/* Since combat actions must have a user, and the user of an action triggered by
 * a condition is not well defined, we'll create a placeholder */
export function createTriggeredActionUserCombatant(name: string, condition: CombatantCondition) {
  const combatant = new Combatant(
    { id: condition.appliedBy || "0", name },
    new CombatantProperties(
      CombatantClass.Mage,
      CombatantSpecies.Dragon,
      null,
      null,
      Vector3.Zero()
    )
  );
  combatant.combatantProperties.asUserOfTriggeredCondition = condition;
  return combatant;
}
