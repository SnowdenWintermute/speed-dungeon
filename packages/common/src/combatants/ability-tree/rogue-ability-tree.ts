import { AbilityType } from "../../abilities/index.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatantTraitType } from "../combatant-traits/index.js";
import { AbilityTree } from "./ability-tree.js";

export function setUpRogueAbilityTree() {
  const tree = new AbilityTree();
  tree.assign(0, 0, {
    type: AbilityType.Action,
    actionName: CombatActionName.Blind,
  });
  tree.assign(0, 1, {
    type: AbilityType.Action,
    actionName: CombatActionName.Healing,
  });
  return tree;
}
