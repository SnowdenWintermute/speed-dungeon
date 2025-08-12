import { Vector2 } from "@babylonjs/core";
import { CombatantClass } from "../combatant-class/index.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";

const ABILITY_TREE_DIMENSIONS = new Vector2(5, 4);

export class AbilityTree {
  columns: (CombatActionName | undefined)[][] = Array.from(
    { length: ABILITY_TREE_DIMENSIONS.x },
    () => Array(ABILITY_TREE_DIMENSIONS.y).fill(undefined)
  );
  constructor() {}

  assign(x: number, y: number, actionName: CombatActionName) {
    if (y > ABILITY_TREE_DIMENSIONS.y - 1) throw new Error("out of bounds");
    const row = this.columns[x];
    if (row === undefined) throw new Error("out of bounds");
    row[y] = actionName;
  }
}

export const ABILITY_TREES: Record<CombatantClass, AbilityTree> = setUpAbilityTrees();

function setUpAbilityTrees() {
  return {
    [CombatantClass.Warrior]: setUpWarriorAbilityTree(),
    [CombatantClass.Mage]: new AbilityTree(),
    [CombatantClass.Rogue]: new AbilityTree(),
  };
}

function setUpWarriorAbilityTree() {
  const tree = new AbilityTree();
  tree.assign(0, 0, CombatActionName.Fire);
  tree.assign(0, 1, CombatActionName.IceBoltParent);
  tree.assign(2, 2, CombatActionName.ExplodingArrowParent);
  tree.assign(4, 3, CombatActionName.Healing);
  tree.assign(3, 1, CombatActionName.Blind);
  tree.assign(1, 3, CombatActionName.ChainingSplitArrowParent);
  return tree;
}
