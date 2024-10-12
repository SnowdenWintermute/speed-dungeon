import { Vector3 } from "@babylonjs/core";
import { CombatAction } from "../combat/combat-actions/index.js";
import { PhysicalDamageType } from "../combat/hp-change-source-types.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { Item } from "../items/index.js";
import { EquipmentSlot } from "../items/equipment/slots.js";
import { CombatantAbility, CombatantAbilityName } from "./abilities/index.js";
import { getAbilityCostIfOwned } from "./abilities/ability-mana-cost-getters.js";
import getAbilityIfOwned from "./abilities/get-ability-if-owned.js";
import combatantCanUseItem from "./can-use-item.js";
import changeCombatantMana from "./change-combatant-mana.js";
import changeCombatantHitPoints from "./change-hit-points.js";
import clampHpAndMpToMax from "./clamp-hp-and-mp-to-max.js";
import { CombatAttribute } from "./combat-attributes.js";
import { CombatantClass } from "./combatant-class/index.js";
import { CombatantSpecies } from "./combatant-species.js";
import { CombatantTrait } from "./combatant-traits.js";
import dropEquippedItem from "./drop-equipped-item.js";
import dropItem from "./drop-item.js";
import equipItem from "./equip-item.js";
import getAbilityNamesFilteredByUseableContext from "./get-ability-names-filtered-by-usable-context.js";
import { getCombatActionPropertiesIfOwned } from "./get-combat-action-properties.js";
import getCombatantTotalAttributes from "./get-combatant-total-attributes.js";
import getCombatantTotalElementalAffinities from "./get-combatant-total-elemental-affinities.js";
import getCombatantTotalPhysicalDamageTypeAffinities from "./get-combatant-total-physical-damage-type-affinities.js";
import getEquipmentInSlot from "./get-equipment-in-slot.js";
import getEquippedWeapon from "./get-equipped-weapon.js";
import getSlotItemIsEquippedTo from "./get-slot-item-is-equipped-to.js";
import { Inventory } from "./inventory.js";
import setHpAndMpToMax from "./set-hp-and-mp-to-max.js";
import unequipSlots from "./unequip-slots.js";
import { immerable } from "immer";
import { COMBATANT_TIME_TO_MOVE_ONE_METER, DEFAULT_HITBOX_RADIUS_FALLBACK } from "../app-consts.js";
import { cloneVector3 } from "../utils/index.js";
import awardLevelups from "./award-levelups.js";
import { incrementAttributePoint } from "./increment-attribute-point.js";
import { MonsterType } from "../monsters/monster-types.js";

export class CombatantProperties {
  [immerable] = true;
  inherentAttributes: CombatantAttributeRecord = {};
  inherentElementalAffinities: Partial<Record<MagicalElement, number>> = {};
  inherentPhysicalDamageTypeAffinities: Partial<Record<PhysicalDamageType, number>> = {};
  level: number = 1;
  unspentAttributePoints: number = 0;
  unspentAbilityPoints: number = 0;
  hitPoints: number = 0;
  mana: number = 0;
  speccedAttributes: CombatantAttributeRecord = {};
  experiencePoints: ExperiencePoints = { current: 0, requiredForNextLevel: 100 };
  // status_effects: Vec<StatusEffects>;
  equipment: Partial<Record<EquipmentSlot, Item>> = {};
  inventory: Inventory = new Inventory();
  traits: CombatantTrait[] = [];
  selectedCombatAction: null | CombatAction = null;
  combatActionTarget: null | CombatActionTarget = null;
  hitboxRadius: number = DEFAULT_HITBOX_RADIUS_FALLBACK;
  abilities: Partial<Record<CombatantAbilityName, CombatantAbility>> = {};
  constructor(
    public combatantClass: CombatantClass,
    public combatantSpecies: CombatantSpecies,
    public monsterType: null | MonsterType,
    public controllingPlayer: null | string,
    public homeLocation: Vector3
  ) {
    this.abilities[CombatantAbilityName.Attack] = CombatantAbility.createByName(
      CombatantAbilityName.Attack
    );
    this.abilities[CombatantAbilityName.AttackMeleeMainhand] = CombatantAbility.createByName(
      CombatantAbilityName.AttackMeleeMainhand
    );
    this.abilities[CombatantAbilityName.AttackMeleeOffhand] = CombatantAbility.createByName(
      CombatantAbilityName.AttackMeleeOffhand
    );
    this.abilities[CombatantAbilityName.AttackRangedMainhand] = CombatantAbility.createByName(
      CombatantAbilityName.AttackRangedMainhand
    );
  }

  static getCombatActionPropertiesIfOwned = getCombatActionPropertiesIfOwned;
  static getTotalAttributes = getCombatantTotalAttributes;
  static getCombatantTotalElementalAffinities = getCombatantTotalElementalAffinities;
  static getCombatantTotalPhysicalDamageTypeAffinities =
    getCombatantTotalPhysicalDamageTypeAffinities;
  static getEquipmentInSlot = getEquipmentInSlot;
  static getEquippedWeapon = getEquippedWeapon;
  static setHpAndMpToMax = setHpAndMpToMax;
  static getAbilityNamesFilteredByUseableContext = getAbilityNamesFilteredByUseableContext;
  static getSlotItemIsEquippedTo = getSlotItemIsEquippedTo;
  static getAbilityCostIfOwned = getAbilityCostIfOwned;
  static getAbilityIfOwned = getAbilityIfOwned;
  static changeHitPoints = changeCombatantHitPoints;
  static changeMana = changeCombatantMana;
  static clampHpAndMpToMax = clampHpAndMpToMax;
  static unequipSlots = unequipSlots;
  static dropItem = dropItem;
  static dropEquippedItem = dropEquippedItem;
  static canUseItem = combatantCanUseItem;
  static equipItem = equipItem;
  static awardLevelups = awardLevelups;
  static incrementAttributePoint = incrementAttributePoint;
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
    // console.log(formatVector3(combatantProperties.homeLocation));
    // return cloneVector3(combatantProperties.homeLocation).subtract(new Vector3(0, 0, z));
    return cloneVector3(new Vector3(0, 0, z)).subtract(combatantProperties.homeLocation);
  }
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;
