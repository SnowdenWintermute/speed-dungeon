import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatAttribute } from "./index.js";

export const DERIVED_ATTRIBUTE_RATIOS: Partial<
  Record<CombatAttribute, Partial<Record<CombatAttribute, number>>>
> = {
  [CombatAttribute.Dexterity]: {
    [CombatAttribute.Accuracy]: 1.5,
  },
  [CombatAttribute.Spirit]: {
    [CombatAttribute.Mp]: 1,
  },
  [CombatAttribute.Agility]: {
    [CombatAttribute.Evasion]: 1,
    [CombatAttribute.Speed]: 1,
  },
  [CombatAttribute.Vitality]: {
    [CombatAttribute.Hp]: 2,
    // [CombatAttribute.ArmorClass]: 1.5,
  },
};

export const DEX_TO_ACCURACY_RATIO =
  DERIVED_ATTRIBUTE_RATIOS?.[CombatAttribute.Dexterity]?.[CombatAttribute.Accuracy] || 1;

// flattened once or every attribute lookup costs nested iterateNumericEnumKeyedRecord
// which proved expensive in the analysis runs when we need many hundreds of lookups
// as fast as possible in the simulated dungeon runs
export const DERIVED_ATTRIBUTE_RATIO_LIST: {
  mainAttribute: CombatAttribute;
  derivedAttribute: CombatAttribute;
  ratio: number;
}[] = iterateNumericEnumKeyedRecord(DERIVED_ATTRIBUTE_RATIOS).flatMap(
  ([mainAttribute, attributeRatios]) =>
    iterateNumericEnumKeyedRecord(attributeRatios).map(([derivedAttribute, ratio]) => ({
      mainAttribute,
      derivedAttribute,
      ratio,
    }))
);
