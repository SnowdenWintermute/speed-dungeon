import { CombatAttribute } from "@speed-dungeon/common";
import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";

/**
 * What each analysis can honestly gate equipment on. A study only optimizes for its own goal, so
 * attributes outside that goal are whatever a build incidentally accumulated — a number, but not one
 * that means anything. Gating on those needs a study that actually measures them.
 */
export const DERIVABLE_REQUIREMENT_ATTRIBUTES: Record<DungeonRunAnalysis, CombatAttribute[]> = {
  // measures the accuracy ceiling a build can reach, which is not what a build is worth for wearing
  // things — it has no requirement to offer
  [DungeonRunAnalysis.MaxAccuracy]: [],
  // spirit belongs here because a sampled damage run can seat a caster: it is only honest for a
  // target whose slice names a goal that actually optimizes it, which is what the goal slice is for
  [DungeonRunAnalysis.SampledDamage]: [
    CombatAttribute.Strength,
    CombatAttribute.Dexterity,
    CombatAttribute.Spirit,
  ],
};
