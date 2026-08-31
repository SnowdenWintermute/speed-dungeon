import { CombatAttribute } from "@speed-dungeon/common";
import { DungeonRunAnalysis } from "../../analysis-runs/dungeon-run-analysis.ts";

export const DERIVABLE_EQUIPMENT_REQUIREMENT_ATTRIBUTES: Record<
  DungeonRunAnalysis,
  CombatAttribute[]
> = {
  [DungeonRunAnalysis.MaxAccuracy]: [],
  [DungeonRunAnalysis.SampledDamage]: [
    CombatAttribute.Strength,
    CombatAttribute.Dexterity,
    CombatAttribute.Spirit,
  ],
  [DungeonRunAnalysis.ArmorClass]: [],
  [DungeonRunAnalysis.MaxSpeed]: [],
};
