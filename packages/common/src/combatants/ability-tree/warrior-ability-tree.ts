import { AbilityTree } from "./ability-tree.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { AbilityType } from "./ability-types.js";
import { CombatantTraitType } from "../combatant-traits/index.js";

export function setUpWarriorAbilityTree() {
  const tree = new AbilityTree();
  tree.assign(0, 0, { type: AbilityType.Action, actionName: CombatActionName.Fire });
  tree.assign(0, 1, { type: AbilityType.Action, actionName: CombatActionName.IceBoltParent });
  tree.assign(2, 2, {
    type: AbilityType.Action,
    actionName: CombatActionName.ExplodingArrowParent,
  });
  tree.assign(4, 0, { type: AbilityType.Trait, traitType: CombatantTraitType.ExtraHotswapSlot });
  tree.assign(4, 1, { type: AbilityType.Action, actionName: CombatActionName.Healing });
  tree.assign(3, 1, { type: AbilityType.Action, actionName: CombatActionName.Blind });
  tree.assign(1, 3, {
    type: AbilityType.Action,
    actionName: CombatActionName.ChainingSplitArrowParent,
  });
  return tree;
}
