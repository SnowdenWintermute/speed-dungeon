import { CombatAction } from "../combat/combat-actions";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets";
import { Item } from "../items";
import { EquipmentSlot } from "../items/equipment/slots";
import { CombatantAbility, CombatantAbilityNames } from "./abilities";
import { CombatAttribute } from "./combat-attributes";
import { CombatantClass } from "./combatant-classes";
import { CombatantSpecies } from "./combatant-species";
import { CombatantTrait } from "./combatant-traits";
import { getCombatActionPropertiesIfOwned } from "./get-combat-action-properties";
import getCombatantTotalAttributes from "./get-combatant-total-attributes";
import getEquipmentInSlot from "./get-equipment-in-slot";
import getEquippedWeapon from "./get-equipped-weapon";
import Inventory from "./inventory";

export class CombatantProperties {
  inherentAttributes: CombatantAttributeRecord = {};
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
    public abilities: Partial<Record<CombatantAbilityNames, CombatantAbility>>,
    public controllingPlayer: null | string
  ) {}

  getCombatActionPropertiesIfOwned = getCombatActionPropertiesIfOwned;
  getTotalAttributes = getCombatantTotalAttributes;
  getEquipmentInSlot = getEquipmentInSlot;
  getEquippedWeapon = getEquippedWeapon;
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};

export type CombatantAttributeRecord = Partial<Record<CombatAttribute, number>>;
