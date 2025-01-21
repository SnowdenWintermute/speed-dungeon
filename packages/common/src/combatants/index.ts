import { Vector3 } from "@babylonjs/core";
import { CombatAction } from "../combat/combat-actions/index.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import {
  CombatantAbility,
  AbilityName,
  getAbilityManaCostIfOwned,
  getAbilityManaCostForCombatant,
} from "./abilities/index.js";
import getAbilityIfOwned from "./abilities/get-ability-if-owned.js";
import combatantCanUseItem from "./can-use-item.js";
import changeCombatantMana from "./resources/change-mana.js";
import changeCombatantHitPoints from "./resources/change-hit-points.js";
import clampResourcesToMax from "./resources/clamp-resources-to-max.js";
import { CombatantClass } from "./combatant-class/index.js";
import { CombatantSpecies } from "./combatant-species.js";
import { CombatantTrait, CombatantTraitType } from "./combatant-traits/index.js";
import dropEquippedItem from "./inventory/drop-equipped-item.js";
import dropItem from "./inventory/drop-item.js";
import getAbilityNamesFilteredByUseableContext from "./abilities/get-ability-names-filtered-by-usable-context.js";
import { getCombatActionPropertiesIfOwned } from "./get-combat-action-properties.js";
import getCombatantTotalAttributes from "./attributes/get-combatant-total-attributes.js";
import getCombatantTotalElementalAffinities from "./combatant-traits/get-combatant-total-elemental-affinities.js";
import getCombatantTotalKineticDamageTypeAffinities from "./combatant-traits/get-combatant-total-kinetic-damage-type-affinities.js";
import setResourcesToMax from "./resources/set-resources-to-max.js";
import { immerable } from "immer";
import { COMBATANT_TIME_TO_MOVE_ONE_METER, DEFAULT_HITBOX_RADIUS_FALLBACK } from "../app-consts.js";
import { cloneVector3 } from "../utils/index.js";
import awardLevelups, { XP_REQUIRED_TO_REACH_LEVEL_2 } from "./experience-points/award-levelups.js";
import { incrementAttributePoint } from "./attributes/increment-attribute.js";
import { MonsterType } from "../monsters/monster-types.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import {
  CombatantEquipment,
  equipItem,
  getEquippedWeapon,
  getSlotItemIsEquippedTo,
  getUsableWeaponsInSlots,
  unequipSlots,
} from "./combatant-equipment/index.js";
import { CombatAttribute } from "./attributes/index.js";
import { getOwnedEquipment } from "./inventory/get-owned-items.js";
import { EntityId } from "../primatives/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { canPickUpItem } from "./inventory/can-pick-up-item.js";
import { getAllUsableActionsCombatantCanPerform } from "./get-all-usable-actions-combatant-can-perform.js";
import { combatantCanUseOwnedAbility } from "./abilities/can-use-owned-ability.js";
import { EntityProperties } from "../primatives/index.js";
import { Inventory } from "./inventory/index.js";

export * from "./combatant-class/index.js";
export * from "./combatant-species.js";
export * from "./combatant-traits/index.js";
export * from "./abilities/index.js";
export * from "./get-combat-action-properties.js";
export * from "./inventory/index.js";
export * from "./update-home-position.js";
export * from "./combatant-equipment/index.js";

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
  inherentElementalAffinities: Partial<Record<MagicalElement, number>> = {};
  inherentKineticDamageTypeAffinities: Partial<Record<KineticDamageType, number>> = {};
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
  abilities: Partial<Record<AbilityName, CombatantAbility>> = {};
  traits: CombatantTrait[] = [];
  equipment: CombatantEquipment = new CombatantEquipment();
  // holdable equipment hotswap slots
  // - should hold the item separately of the inventory bags
  // - should be consistently accessible by their number (same items each time)
  // - should be limitable by the type of equipment they can hold (shield only, swords only etc)
  inventory: Inventory = new Inventory();
  selectedCombatAction: null | CombatAction = null;
  combatActionTarget: null | CombatActionTarget = null;
  hitboxRadius: number = DEFAULT_HITBOX_RADIUS_FALLBACK;
  deepestFloorReached: number = 1;
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
    this.abilities[AbilityName.Attack] = CombatantAbility.createByName(AbilityName.Attack);
    this.abilities[AbilityName.AttackMeleeMainhand] = CombatantAbility.createByName(
      AbilityName.AttackMeleeMainhand
    );
    this.abilities[AbilityName.AttackMeleeOffhand] = CombatantAbility.createByName(
      AbilityName.AttackMeleeOffhand
    );
    this.abilities[AbilityName.AttackRangedMainhand] = CombatantAbility.createByName(
      AbilityName.AttackRangedMainhand
    );
  }

  static getCombatActionPropertiesIfOwned = getCombatActionPropertiesIfOwned;
  static getTotalAttributes = getCombatantTotalAttributes;
  static getCombatantTotalElementalAffinities = getCombatantTotalElementalAffinities;
  static getCombatantTotalKineticDamageTypeAffinities =
    getCombatantTotalKineticDamageTypeAffinities;
  static getEquippedWeapon = getEquippedWeapon;
  static getUsableWeaponsInSlots = getUsableWeaponsInSlots;
  static getAbilityNamesFilteredByUseableContext = getAbilityNamesFilteredByUseableContext;
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
  static getAbilityManaCostIfOwned = getAbilityManaCostIfOwned;
  static getAbilityManaCost = getAbilityManaCostForCombatant;
  static getAbilityIfOwned = getAbilityIfOwned;
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

  static getAllUsableActions = getAllUsableActionsCombatantCanPerform;
  static canUseOwnedAbility = combatantCanUseOwnedAbility;

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

  static getPositionForActionUse(
    user: CombatantProperties,
    target: CombatantProperties,
    isMelee: boolean
  ) {
    let destinationLocation = user.homeLocation;
    if (!isMelee) {
      // assign destination to move a little forward (default ranged attack/spell casting position)
      const direction = CombatantProperties.getForward(user);
      destinationLocation = cloneVector3(user.homeLocation).add(direction.scale(0.5));
    } else {
      // assign destination based on target location and their hitbox radii
      // we're recreating this vec3 because when
      // combatants are copied to the client they don't keep their Vector3 methods
      const direction = cloneVector3(target.homeLocation).subtract(user.homeLocation).normalize();

      destinationLocation = cloneVector3(target.homeLocation).subtract(
        direction.scale(target.hitboxRadius + user.hitboxRadius)
      );
    }

    const distance = Vector3.Distance(destinationLocation, user.homeLocation);

    const speedMultiplier = 1;
    const totalTimeToReachDestination =
      COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;

    return { destinationLocation, distance, totalTimeToReachDestination };
  }

  static getForward(combatantProperties: CombatantProperties) {
    const { x, y, z } = combatantProperties.homeLocation;
    return cloneVector3(new Vector3(x, 0, 0)).subtract(combatantProperties.homeLocation);
  }
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;
