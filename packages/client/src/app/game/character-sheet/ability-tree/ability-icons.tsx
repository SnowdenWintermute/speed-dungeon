import { AbilityTreeAbility, AbilityType } from "@speed-dungeon/common";
import { ACTION_ICONS } from "./action-icons";

export function getAbilityIcon(ability: AbilityTreeAbility) {
  switch (ability.type) {
    case AbilityType.Action:
      return ACTION_ICONS[ability.actionName];
    case AbilityType.Trait:
      return () => null;
  }
}
