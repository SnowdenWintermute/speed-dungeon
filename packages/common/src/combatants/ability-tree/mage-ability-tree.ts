import { AbilityTree } from "./ability-tree.js";
import { AbilityType } from "../../abilities/ability-types.js";
import { CombatantTraitType } from "../combatant-traits/trait-types.js";

export function setUpMageAbilityTree() {
  const tree = new AbilityTree();
  // tree.assign(0, 0, { type: AbilityType.Action, actionName: CombatActionName.Fire });
  // tree.assign(0, 1, { type: AbilityType.Action, actionName: CombatActionName.Firewall });
  // tree.assign(0, 2, { type: AbilityType.Action, actionName: CombatActionName.IceBoltParent });
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
