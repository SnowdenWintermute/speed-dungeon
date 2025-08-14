import { Vector2 } from "@babylonjs/core";
import { CombatantClass } from "../combatant-class/index.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { AbilityTreeAbility, AbilityType } from "./ability-types.js";

export * from "./ability-types.js";

export const ABILITY_TREE_DIMENSIONS = new Vector2(5, 4);

export class AbilityTree {
  columns: (AbilityTreeAbility | undefined)[][] = Array.from(
    { length: ABILITY_TREE_DIMENSIONS.x },
    () => Array(ABILITY_TREE_DIMENSIONS.y).fill(undefined)
  );
  constructor() {}

  assign(x: number, y: number, ability: AbilityTreeAbility) {
    if (y > ABILITY_TREE_DIMENSIONS.y - 1) throw new Error("out of bounds");
    const row = this.columns[x];
    if (row === undefined) throw new Error("out of bounds");
    row[y] = ability;
  }
}

export const ABILITY_TREES: Record<CombatantClass, AbilityTree> = setUpAbilityTrees();
export const EMPTY_ABILITY_TREE = new AbilityTree();

function setUpAbilityTrees() {
  return {
    [CombatantClass.Warrior]: setUpWarriorAbilityTree(),
    [CombatantClass.Mage]: new AbilityTree(),
    [CombatantClass.Rogue]: new AbilityTree(),
  };
}

function setUpWarriorAbilityTree() {
  const tree = new AbilityTree();
  tree.assign(0, 0, { type: AbilityType.Action, actionName: CombatActionName.Fire });
  tree.assign(0, 1, { type: AbilityType.Action, actionName: CombatActionName.IceBoltParent });
  tree.assign(2, 2, {
    type: AbilityType.Action,
    actionName: CombatActionName.ExplodingArrowParent,
  });
  tree.assign(4, 0, { type: AbilityType.Action, actionName: CombatActionName.Healing });
  tree.assign(3, 1, { type: AbilityType.Action, actionName: CombatActionName.Blind });
  tree.assign(1, 3, {
    type: AbilityType.Action,
    actionName: CombatActionName.ChainingSplitArrowParent,
  });
  return tree;
}
