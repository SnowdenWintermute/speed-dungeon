import { StudyPanel } from "../../components/study-panel.tsx";
import { FULL_ALLOCATION_INTENSITY } from "../../analysis-runs/allocation-intensity.ts";
import { StudyName } from "../study-name.ts";
import { MAX_ACCURACY_TABLE_COLUMNS } from "./columns.tsx";
import { MaxAccuracyTable } from "./table.ts";
import { GenerateMonsterEvasionFromAccuracyTable } from "./generate-monster-evasion-from-accuracy-table.tsx";

export function MaxAccuracyPanel() {
  return (
    <StudyPanel
      studyName={StudyName.MaxAccuracyMixed}
      columns={MAX_ACCURACY_TABLE_COLUMNS}
      tableConstructor={MaxAccuracyTable}
      // determinePerFloorMonsterEvasion applies the intended investment share itself, so the run it
      // reads has to be the unscaled ceiling. running under full intensity would discount twice
      fixedAllocationIntensity={FULL_ALLOCATION_INTENSITY}
      renderTableActions={(table) => <GenerateMonsterEvasionFromAccuracyTable table={table} />}
    />
  );
}
