import { Vector3, Wav2Decode } from "babylonjs";
import { CombatAction } from "../combat/combat-actions";
import { PhysicalDamageType } from "../combat/hp-change-source-types";
import { MagicalElement } from "../combat/magical-elements";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets";
import { Item } from "../items";
import { EquipmentSlot } from "../items/equipment/slots";
import { CombatantAbility, CombatantAbilityName } from "./abilities";
import { getAbilityCostIfOwned } from "./abilities/ability-mana-cost-getters";
import getAbilityIfOwned from "./abilities/get-ability-if-owned";
import combatantCanUseItem from "./can-use-item";
import changeCombatantMana from "./change-combatant-mana";
import changeCombatantHitPoints from "./change-hit-points";
import clampHpAndMpToMax from "./clamp-hp-and-mp-to-max";
import { CombatAttribute } from "./combat-attributes";
import { CombatantClass } from "./combatant-class";
import { CombatantSpecies } from "./combatant-species";
import { CombatantTrait } from "./combatant-traits";
import dropEquippedItem from "./drop-equipped-item";
import dropItem from "./drop-item";
import equipItem from "./equip-item";
import getAbilityNamesFilteredByUseableContext from "./get-ability-names-filtered-by-usable-context";
import { getCombatActionPropertiesIfOwned } from "./get-combat-action-properties";
import getCombatantTotalAttributes from "./get-combatant-total-attributes";
import getCombatantTotalElementalAffinities from "./get-combatant-total-elemental-affinities";
import getCombatantTotalPhysicalDamageTypeAffinities from "./get-combatant-total-physical-damage-type-affinities";
import getEquipmentInSlot from "./get-equipment-in-slot";
import getEquippedWeapon from "./get-equipped-weapon";
import getSlotItemIsEquippedTo from "./get-slot-item-is-equipped-to";
import { Inventory } from "./inventory";
import setHpAndMpToMax from "./set-hp-and-mp-to-max";
import unequipSlots from "./unequip-slots";
import { immerable } from "immer";
import { COMBATANT_TIME_TO_MOVE_ONE_METER, DEFAULT_HITBOX_RADIUS_FALLBACK } from "../app_consts";

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
  // inherent_elemental_affinities: HashMap<MagicalElements; i16>,
  selectedCombatAction: null | CombatAction = null;
  combatActionTarget: null | CombatActionTarget = null;
  inputLock: {
    timeLocked: null | number;
    lockDuration: null | number;
  } = {
    timeLocked: null,
    lockDuration: null,
  };
  hitboxRadius: number = DEFAULT_HITBOX_RADIUS_FALLBACK;
  constructor(
    public combatantClass: CombatantClass,
    public combatantSpecies: CombatantSpecies,
    public abilities: Partial<Record<CombatantAbilityName, CombatantAbility>>,
    public controllingPlayer: null | string,
    public homeLocation: Vector3
  ) {}

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
  static lockInput(combatantProperties: CombatantProperties) {
    combatantProperties.inputLock.timeLocked = Date.now();
    combatantProperties.inputLock.lockDuration = null;
  }
  static increaseLockoutDuration(combatantProperties: CombatantProperties, ms: number) {
    if (combatantProperties.inputLock.lockDuration === null)
      combatantProperties.inputLock.lockDuration = ms;
    else combatantProperties.inputLock.lockDuration += ms;
  }
  static isLocked(combatantProperties: CombatantProperties) {
    const { timeLocked, lockDuration } = combatantProperties.inputLock;
    if (timeLocked !== null && lockDuration === null) return true;
    if (timeLocked !== null && Date.now() < timeLocked + (lockDuration ?? 0)) return true;
    return false;
  }
  static getPositionForActionUse(
    user: CombatantProperties,
    target: CombatantProperties,
    isMelee: boolean
  ) {
    let destinationLocation = user.homeLocation;
    if (!isMelee) {
      // assign destination to move a little forward (default ranged attack/spell casting position)
      const { x, y, z } = user.homeLocation;
      const direction = user.homeLocation.subtract(new Vector3(x, y, 0));
      destinationLocation = user.homeLocation.add(direction.scale(1.5));
    } else {
      // assign destination based on target location and their hitbox radii
      // we're recreating this vec3 because when
      // combatants are copied to the client they don't keep their Vector3 methods
      const direction = new Vector3(...Object.values(target.homeLocation))
        .subtract(user.homeLocation)
        .normalize();

      destinationLocation = new Vector3(...Object.values(target.homeLocation)).subtract(
        direction.scale(target.hitboxRadius + user.hitboxRadius)
      );
    }

    const distance = Vector3.Distance(destinationLocation, user.homeLocation);

    const speedMultiplier = 1;
    const totalTimeToReachDestination =
      COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;

    return { destinationLocation, distance, totalTimeToReachDestination };
  }
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;
