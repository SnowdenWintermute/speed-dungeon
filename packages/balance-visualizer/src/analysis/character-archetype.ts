import { CombatAttribute, CombatantClass } from "@speed-dungeon/common";

// what equipment or attribute the character is restricted
// to optimize with
export enum CharacterArchetype {
  TwoHandedMelee,
  Bow,
  DualWield,
  ShieldUser,
  SpiritMaximizer,
}

export const CHARACTER_ARCHETYPES = [
  CharacterArchetype.TwoHandedMelee,
  CharacterArchetype.Bow,
  CharacterArchetype.DualWield,
  CharacterArchetype.ShieldUser,
  CharacterArchetype.SpiritMaximizer,
];

export const CHARACTER_ARCHETYPE_NAMES: Record<CharacterArchetype, string> = {
  [CharacterArchetype.TwoHandedMelee]: "Two-handed melee",
  [CharacterArchetype.Bow]: "Bow",
  [CharacterArchetype.DualWield]: "Dual wield",
  [CharacterArchetype.ShieldUser]: "One hand and shield",
  [CharacterArchetype.SpiritMaximizer]: "Spirit maximizer",
};

export enum HoldableConfiguration {
  TwoHandedMelee,
  TwoHandedRanged,
  DualWield,
  OneHandAndShield,
  Unconstrained,
}

export interface ArchetypeProfile {
  allowedClasses: CombatantClass[];
  holdableConfiguration: HoldableConfiguration;
  forcedAllocationAttribute: null | CombatAttribute;
}

export const DEFAULT_ARCHETYPE_PROFILES: Record<CharacterArchetype, ArchetypeProfile> = {
  [CharacterArchetype.TwoHandedMelee]: {
    allowedClasses: [CombatantClass.Warrior, CombatantClass.Rogue],
    holdableConfiguration: HoldableConfiguration.TwoHandedMelee,
    forcedAllocationAttribute: null,
  },
  [CharacterArchetype.Bow]: {
    allowedClasses: [CombatantClass.Rogue],
    holdableConfiguration: HoldableConfiguration.TwoHandedRanged,
    forcedAllocationAttribute: null,
  },
  [CharacterArchetype.DualWield]: {
    allowedClasses: [CombatantClass.Warrior, CombatantClass.Rogue],
    holdableConfiguration: HoldableConfiguration.DualWield,
    forcedAllocationAttribute: null,
  },
  [CharacterArchetype.ShieldUser]: {
    allowedClasses: [CombatantClass.Warrior, CombatantClass.Rogue],
    holdableConfiguration: HoldableConfiguration.OneHandAndShield,
    forcedAllocationAttribute: null,
  },
  [CharacterArchetype.SpiritMaximizer]: {
    allowedClasses: [CombatantClass.Mage],
    holdableConfiguration: HoldableConfiguration.Unconstrained,
    forcedAllocationAttribute: CombatAttribute.Spirit,
  },
};
