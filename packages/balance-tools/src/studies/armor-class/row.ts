import { AnalysisTableRow } from "../../analysis-runs/analysis-sample-table.ts";
import { BaseItemAndPercent } from "../../analysis-subjects/equipment-base-item-tally.ts";
import { Distribution } from "../../statistics/distribution.ts";
import { ArmorClassSlotId } from "./slots.ts";

export interface ArmorClassTableRow extends AnalysisTableRow {
  /** the most armor class the solver could dress a character in while standing in this room */
  totalArmorClass: Distribution;
  /** means, so the three read against each other and against the total */
  averageArmorClassBySlot: Record<ArmorClassSlotId, number>;
  /** percent of matched characters wearing it in this room, counted once per slot it filled */
  wornArmorPercentages: BaseItemAndPercent[];
  /** percent of runs in which it had dropped by this room; the holdable column reads weapons */
  availableArmorPercentages: BaseItemAndPercent[];
}
