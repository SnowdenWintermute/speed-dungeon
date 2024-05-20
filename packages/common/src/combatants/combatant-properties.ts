import { CombatAction } from "../combat/combat-actions";
import { CombatantAbility, CombatantAbilityNames } from "./abilities";
import { CombatAttributes } from "./combat-attributes";
import { CombatantClass } from "./combatant-classes";
import { CombatantSpecies } from "./combatant-species";

export class CombatantProperties {
  inherentAttributes: { [key in CombatAttributes]?: number } = {};
  level: number = 1;
  unspentAttributePoints: number = 0;
  unspentAbilityPoints: number = 0;
  hitPoints: number = 0;
  mana: number = 0;
  speccedAttributes: { [key in CombatAttributes]?: number } = {};
  experiencePoints: ExperiencePoints = { current: 0, requiredForNextLevel: 100 };
  // status_effects: Vec<StatusEffects>;
  // equipment: HashMap<EquipmentSlots; Item>,
  inventory: Inventory;
  // traits: Vec<CombatantTraits>;
  // inherent_elemental_affinities: HashMap<MagicalElements; i16>,
  selectedCombatAction: null | CombatAction = null;
  // combat_action_targets: Option<CombatActionTarget>;
  constructor(
    public combatantClass: CombatantClass,
    public combatantSpecies: CombatantSpecies,
    public abilities: Record<CombatantAbilityNames, CombatantAbility>,
    public controllingPlayer: null | string
  ) {}
}

export type ExperiencePoints = {
  current: number;
  requiredForNextLevel: null | number;
};
