import { DungeonRunAnalysis } from "@/analysis-runs/dungeon-run-analysis";
import { StudyPanel } from "@/components/StudyPanel";
import { MAX_ACCURACY_TABLE_COLUMNS } from "./columns";
import { MaxAccuracyTable } from "./table";

export function MaxAccuracyPanel() {
  return (
    <StudyPanel
      analysis={DungeonRunAnalysis.MaxAccuracy}
      columns={MAX_ACCURACY_TABLE_COLUMNS}
      tableConstructor={MaxAccuracyTable}
    />
  );
}
