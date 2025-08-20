import { AbilityUtils } from "../../abilities/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantClass } from "../combatant-class/index.js";
import { AbilityTree } from "./ability-tree.js";
import { setUpMageAbilityTree } from "./mage-ability-tree.js";
import { setUpRogueAbilityTree } from "./rogue-ability-tree.js";
import { setUpWarriorAbilityTree } from "./warrior-ability-tree.js";

function setUpAbilityTrees() {
  return {
    [CombatantClass.Warrior]: setUpWarriorAbilityTree(),
    [CombatantClass.Mage]: setUpMageAbilityTree(),
    [CombatantClass.Rogue]: setUpRogueAbilityTree(),
  };
}

export const ABILITY_TREES: Record<CombatantClass, AbilityTree> = setUpAbilityTrees();
export const EMPTY_ABILITY_TREE = new AbilityTree();

export const ABILITY_CLASS_AND_LEVEL_REQUIREMENTS: Record<
  string,
  { combatantClass: CombatantClass; level: number }
> = (() => {
  const toReturn: Record<string, { combatantClass: CombatantClass; level: number }> = {};
  for (const [combatantClass, tree] of iterateNumericEnumKeyedRecord(ABILITY_TREES)) {
    for (const column of tree.columns) {
      for (const ability of column) {
        if (ability === undefined) continue;
        const characterLevelRequiredForFirstRank =
          AbilityUtils.getCharacterLevelRequiredForFirstRank(tree, ability);
        toReturn[JSON.stringify(ability)] = {
          combatantClass,
          level: characterLevelRequiredForFirstRank,
        };
      }
    }
  }
  return toReturn;
})();
