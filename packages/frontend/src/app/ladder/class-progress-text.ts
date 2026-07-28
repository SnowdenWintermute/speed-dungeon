import { COMBATANT_CLASS_NAME_STRINGS, CombatantClass } from "@speed-dungeon/common";

interface ClassProgress {
  combatantClass: CombatantClass;
  level: number;
}

// a class and the level reached in it, written the same way on every board and record page
export function classProgressText(progress: ClassProgress): string {
  return `${COMBATANT_CLASS_NAME_STRINGS[progress.combatantClass]} ${progress.level}`;
}

// a character without a support class is a character that has one fewer thing, not one with an
// unknown one, so the cell says so rather than sitting empty
export function supportClassText(progressOption: ClassProgress | null | undefined): string {
  if (progressOption === undefined || progressOption === null) {
    return "—";
  }
  return classProgressText(progressOption);
}
