import { AbilityType } from "../../abilities/ability-types.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatantTraitType } from "../combatant-traits/trait-types.js";
import { AbilityTree } from "./ability-tree.js";

export function setUpRogueAbilityTree() {
  const tree = new AbilityTree();
  tree.assign(0, 0, {
    type: AbilityType.Action,
    actionName: CombatActionName.Blind,
  });

  tree.assign(0, 1, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.Counterattack,
  });

  tree.assign(2, 1, {
    type: AbilityType.Action,
    actionName: CombatActionName.ExplodingArrowParent,
  });
  tree.assign(2, 3, {
    type: AbilityType.Action,
    actionName: CombatActionName.ChainingSplitArrowParent,
  });

  tree.assign(1, 1, { type: AbilityType.Action, actionName: CombatActionName.TamePet });

  tree.assign(4, 0, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.HpBioavailability,
  });
  tree.assign(4, 1, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.MpBioavailability,
  });
  tree.assign(3, 0, {
    type: AbilityType.Trait,
    traitType: CombatantTraitType.CanConvertToShardsManually,
  });
  return tree;
}
