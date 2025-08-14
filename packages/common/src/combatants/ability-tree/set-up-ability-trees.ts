import { CombatantClass } from "../combatant-class/index.js";
import { AbilityTree } from "./ability-tree.js";
import { setUpWarriorAbilityTree } from "./warrior-ability-tree.js";

function setUpAbilityTrees() {
  return {
    [CombatantClass.Warrior]: setUpWarriorAbilityTree(),
    [CombatantClass.Mage]: new AbilityTree(),
    [CombatantClass.Rogue]: new AbilityTree(),
  };
}

export const ABILITY_TREES: Record<CombatantClass, AbilityTree> = setUpAbilityTrees();
export const EMPTY_ABILITY_TREE = new AbilityTree();
