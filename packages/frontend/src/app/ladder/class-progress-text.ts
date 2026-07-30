import { COMBATANT_CLASS_NAME_STRINGS, CombatantClass } from "@speed-dungeon/common";
import { NO_VALUE_TEXT } from "./display-text";

interface ClassProgress {
  combatantClass: CombatantClass;
  level: number;
}

// a class and the level reached in it, written the same way on every board and record page
export function classProgressText(progress: ClassProgress): string {
  return `${COMBATANT_CLASS_NAME_STRINGS[progress.combatantClass]} ${progress.level}`;
}

export function supportClassText(progressOption: ClassProgress | null | undefined): string {
  if (progressOption === undefined || progressOption === null) {
    return NO_VALUE_TEXT;
  }
  return classProgressText(progressOption);
}
