import { CombatAttribute, EquipmentBaseItem, NormalizedPercentage } from "@speed-dungeon/common";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { StudyName } from "./study-name.ts";

/**
 * One workbook row: which build a piece of equipment is meant for, and how deep into its drop curve
 * to read that build. A base item may have several of these, one per study, so a body armor can take
 * its strength from an attack damage study and its spirit from another.
 */
export interface EquipmentRequirementTarget {
  baseItem: EquipmentBaseItem;
  studyName: StudyName;
  /** which requirements this row derives; a study can only supply the ones it measures */
  attributes: CombatAttribute[];
  buildSlice: AnalysisSlice;
  /**
   * Where on the item's cumulative drop curve to read the build from, as a fraction of the most the
   * curve ever reaches. 0 is the first room it ever dropped in, 1 the room it stops climbing.
   */
  availabilityPercentile: NormalizedPercentage;
}
