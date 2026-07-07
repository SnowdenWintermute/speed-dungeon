import { AbilityTree } from "./ability-tree.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { AbilityType } from "../../abilities/ability-types.js";
import { CombatantTraitType } from "../combatant-traits/trait-types.js";

export function setUpWarriorAbilityTree() {
  const tree = new AbilityTree();
  tree.assign(0, 0, { type: AbilityType.Action, actionName: CombatActionName.Ensnare });

  // traits
  tree.assign(3, 0, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.Parry,
  });
  tree.assign(3, 1, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.HpBioavailability,
  });
  tree.assign(4, 0, { type: AbilityType.Trait, traitType: CombatantTraitType.ExtraHotswapSlot });
  return tree;
}
