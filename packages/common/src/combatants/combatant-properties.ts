import { CombatAction } from "../combat/combat-actions";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets";
import Item from "../items";
import { EquipmentSlot } from "../items/equipment/slots";
import { CombatantAbility, CombatantAbilityNames } from "./abilities";
import { CombatAttribute } from "./combat-attributes";
import { CombatantClass } from "./combatant-classes";
import { CombatantSpecies } from "./combatant-species";
import { getCombatActionPropertiesIfOwned } from "./get-combat-action-properties";
import Inventory from "./inventory";

export class CombatantProperties {
  inherentAttributes: Partial<Record<CombatAttribute, number>> = {};
  level: number = 1;
  unspentAttributePoints: number = 0;
  unspentAbilityPoints: number = 0;
  hitPoints: number = 0;
  mana: number = 0;
  speccedAttributes: Partial<Record<CombatAttribute, number>> = {};
  experiencePoints: ExperiencePoints = { current: 0, requiredForNextLevel: 100 };
  // status_effects: Vec<StatusEffects>;
  equipment: Partial<Record<EquipmentSlot, Item>> = {};
  inventory: Inventory = new Inventory();
  // traits: Vec<CombatantTraits>;
  // inherent_elemental_affinities: HashMap<MagicalElements; i16>,
  selectedCombatAction: null | CombatAction = null;
  combatActionTarget: null | CombatActionTarget = null;
  constructor(
    public combatantClass: CombatantClass,
    public combatantSpecies: CombatantSpecies,
    public abilities: Partial<Record<CombatantAbilityNames, CombatantAbility>>,
    public controllingPlayer: null | string
  ) {}

  getPropertiesIfOwned = getCombatActionPropertiesIfOwned;
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};
