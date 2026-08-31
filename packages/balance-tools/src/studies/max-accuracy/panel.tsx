import { StudyPanel } from "../../components/study-panel.tsx";
import { GenerateMonsterEvasion } from "../../components/generate-monster-evasion.tsx";
import { FULL_ALLOCATION_INTENSITY } from "../../analysis-runs/allocation-intensity.ts";
import { StudyName } from "../study-name.ts";
import { MAX_ACCURACY_TABLE_COLUMNS } from "./columns.tsx";
import { MaxAccuracyTable } from "./table.ts";

export function MaxAccuracyPanel() {
  return (
    <StudyPanel
      studyName={StudyName.MaxAccuracyMixed}
      columns={MAX_ACCURACY_TABLE_COLUMNS}
      tableConstructor={MaxAccuracyTable}
      // determinePerFloorMonsterEvasion applies the intended investment share itself, so the run it
      // reads has to be the unscaled ceiling. running under full intensity would discount twice
      fixedAllocationIntensity={FULL_ALLOCATION_INTENSITY}
      // a total accuracy read never touches a dummy, so arming one would only mislead
      fixedTargetDummiesHaveArmorClass={false}
      renderTableActions={(table) => <GenerateMonsterEvasion table={table} />}
    />
  );
}
