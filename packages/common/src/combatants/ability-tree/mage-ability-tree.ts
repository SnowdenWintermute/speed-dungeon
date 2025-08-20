import { AbilityTree } from "./ability-tree.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatantTraitType } from "../combatant-traits/index.js";
import { AbilityType } from "../../abilities/index.js";

export function setUpMageAbilityTree() {
  const tree = new AbilityTree();
  tree.assign(4, 0, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.MpBioavailability,
  });
  return tree;
}
