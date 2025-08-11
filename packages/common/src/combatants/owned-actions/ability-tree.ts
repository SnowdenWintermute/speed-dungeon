import { Vector2 } from "@babylonjs/core";
import { CombatantClass } from "../combatant-class";

const ABILITY_TREE_DIMENSIONS = new Vector2(5, 4);

export class AbilityTree {
  grid: number[][] = Array.from({ length: ABILITY_TREE_DIMENSIONS.x }, () =>
    Array(ABILITY_TREE_DIMENSIONS.y)
  );
  constructor() {}
}

export const ABILITY_TREES: Record<CombatantClass, AbilityTree> = setUpAbilityTrees();

function setUpAbilityTrees() {
  return {
    [CombatantClass.Warrior]: new AbilityTree(),
    [CombatantClass.Mage]: new AbilityTree(),
    [CombatantClass.Rogue]: new AbilityTree(),
  };
}
