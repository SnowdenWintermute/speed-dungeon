import { CombatAttribute, CombatantClass } from "@speed-dungeon/common";

/** How a character fights. The party draws three of these without replacement, so no two characters
 * in a run share one. */
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

/** Which hands the archetype commits to. Holdables are the outer axis of the equipment search
 * because the slots are coupled — a two-hander takes both hands, a shield only fits one — so they
 * cannot be enumerated as a product across slots the way wearables can. */
export enum HoldableConfiguration {
  TwoHandedMelee,
  TwoHandedRanged,
  DualWield,
  OneHandAndShield,
  /** Whatever reaches the most damage. The spirit maximizer is defined by where their points go,
   * not by what they hold, so their hands are left to the solver. */
  Unconstrained,
}

export interface ArchetypeProfile {
  /** Rolled per run when more than one is allowed, so a run samples the archetype rather than one
   * favourable pairing of it with a class. */
  allowedClasses: CombatantClass[];
  holdableConfiguration: HoldableConfiguration;
  /** Null means the attribute allocation is solved for maximum damage alongside the equipment.
   *
   * That is the whole point of an availability figure: it asks what a character could reach at this
   * room, not what a committed build happens to have. A Warrior facing an evasive floor may well
   * want Dexterity, and pinning them to Strength would answer a question nobody asked.
   *
   * The spirit maximizer is the one archetype defined by its allocation rather than its hands, so
   * it is the one that names an attribute here. */
  forcedAllocationAttribute: null | CombatAttribute;
}

/** Defaults only. The panel exposes these so a combination can be overridden without editing code. */
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
