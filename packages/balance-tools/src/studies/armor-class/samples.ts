import { EquipmentBaseItem } from "@speed-dungeon/common";
import { AnalysisSampleDimensions } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleRunSetResult } from "../../analysis-runs/run-set.ts";
import { ArmorClassSlotId } from "./slots.ts";

/** One denormalized row per run, room and character. */
export interface ArmorClassSample extends AnalysisSampleDimensions {
  totalArmorClass: number;
  armorClassBySlot: Record<ArmorClassSlotId, number>;
  wornArmor: Record<ArmorClassSlotId, EquipmentBaseItem | null>;
}

export type ArmorClassRunSetResult = AnalysisSampleRunSetResult<ArmorClassSample>;
