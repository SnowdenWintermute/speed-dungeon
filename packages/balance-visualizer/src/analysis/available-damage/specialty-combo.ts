import {
  ClassProgressionProperties,
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantClass,
} from "@speed-dungeon/common";
import { CharacterSpec } from "../../sim/character-spec";
import {
  CHARACTER_ARCHETYPE_NAMES,
  CHARACTER_ARCHETYPES,
  CharacterArchetype,
  DEFAULT_ARCHETYPE_PROFILES,
} from "../character-archetype";

// what a table row is about: the same specialty played as a different class, or with a different
// support class, is a different character and gets its own column of numbers
export interface SpecialtyCombo {
  archetype: CharacterArchetype;
  mainClass: CombatantClass;
  supportClass: null | CombatantClass;
}

export type SpecialtyComboKey = string & { __brand: "SpecialtyComboKey" };

export function comboKey(combo: SpecialtyCombo): SpecialtyComboKey {
  return `${combo.archetype}/${combo.mainClass}/${combo.supportClass ?? "none"}` as SpecialtyComboKey;
}

export function comboName(combo: SpecialtyCombo) {
  const support =
    combo.supportClass === null
      ? "no support"
      : `${COMBATANT_CLASS_NAME_STRINGS[combo.supportClass]} support`;
  return `${CHARACTER_ARCHETYPE_NAMES[combo.archetype]}, ${COMBATANT_CLASS_NAME_STRINGS[combo.mainClass]}, ${support}`;
}

export function specOf(combo: SpecialtyCombo): CharacterSpec {
  return { mainClass: combo.mainClass, supportClass: combo.supportClass };
}

/** Support class options come from the game's own rule, so a combo never names one ReadSkillBook
 * would refuse. Null is included because playing without one is a real state, not a missing value. */
export function supportClassOptions(mainClass: CombatantClass): (null | CombatantClass)[] {
  return [null, ...ClassProgressionProperties.supportClassOptionsFor(mainClass)];
}

export const SPECIALTY_COMBOS: SpecialtyCombo[] = CHARACTER_ARCHETYPES.flatMap((archetype) =>
  DEFAULT_ARCHETYPE_PROFILES[archetype].allowedClasses.flatMap((mainClass) =>
    supportClassOptions(mainClass).map((supportClass) => ({ archetype, mainClass, supportClass }))
  )
);
