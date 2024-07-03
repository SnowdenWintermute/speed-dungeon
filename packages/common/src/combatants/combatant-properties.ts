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
import { CombatantClass } from "./combatant-classes";
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

export class CombatantProperties {
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
  constructor(
    public combatantClass: CombatantClass,
    public combatantSpecies: CombatantSpecies,
    public abilities: Partial<Record<CombatantAbilityName, CombatantAbility>>,
    public controllingPlayer: null | string
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
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;
