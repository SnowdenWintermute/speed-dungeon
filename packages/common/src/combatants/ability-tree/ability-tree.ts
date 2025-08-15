import { Vector2 } from "@babylonjs/core";
import { AbilityTreeAbility } from "../../abilities/index.js";

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
