import { AbilityTree } from "./ability-tree.js";
import { CombatantTraitType } from "../combatant-traits/index.js";
import { AbilityType } from "../../abilities/ability-types.js";

export function setUpMageAbilityTree() {
  const tree = new AbilityTree();
  tree.assign(4, 0, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.MpBioavailability,
  });
  tree.assign(3, 0, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.ExtraConsumablesStorage,
  });
  return tree;
}
