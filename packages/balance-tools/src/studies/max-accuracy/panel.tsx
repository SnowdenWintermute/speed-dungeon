import { StudyPanel } from "@/components/study-panel";
import { FULL_ALLOCATION_INTENSITY } from "@/analysis-runs/allocation-intensity";
import { DungeonRunAnalysis } from "@/analysis-runs/dungeon-run-analysis";
import { StudyName } from "@/studies/study-name";
import { MAX_ACCURACY_TABLE_COLUMNS } from "./columns";
import { MaxAccuracyTable } from "./table";
import { GenerateMonsterEvasionFromAccuracyTable } from "./generate-monster-evasion-from-accuracy-table";

export function MaxAccuracyPanel({ studyName }: { studyName: StudyName }) {
  return (
    <StudyPanel
      studyName={studyName}
      analysis={DungeonRunAnalysis.MaxAccuracy}
      columns={MAX_ACCURACY_TABLE_COLUMNS}
      tableConstructor={MaxAccuracyTable}
      // determinePerFloorMonsterEvasion applies the intended investment share itself, so the run it
      // reads has to be the unscaled ceiling. running under full intensity would discount twice
      fixedAllocationIntensity={FULL_ALLOCATION_INTENSITY}
      renderTableActions={(table) => <GenerateMonsterEvasionFromAccuracyTable table={table} />}
    />
  );
}
