import { CombatAttribute, EquipmentBaseItem, NormalizedPercentage } from "@speed-dungeon/common";
import { AnalysisSlice } from "../../analysis-runs/analysis-slice.ts";
import { StudyName } from "../../studies/study-name.ts";

/** One item can derive requirements from multiple study results so can take
 strength from one study and spirit from another. */
export interface EquipmentRequirementTarget {
  baseItem: EquipmentBaseItem;
  studyName: StudyName;
  attributes: CombatAttribute[];
  buildSlice: AnalysisSlice;
  // Where on the item's cumulative drop curve to read the build from, as a fraction of the most the
  // curve ever reaches. 0 is the first room it ever dropped in, 1 the last.
  availabilityPercentile: NormalizedPercentage;
}
