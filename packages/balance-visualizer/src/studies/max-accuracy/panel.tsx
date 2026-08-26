import { StudyPanel } from "@/components/study-panel";
import { MAX_ACCURACY_TABLE_COLUMNS } from "./columns";
import { MaxAccuracyTable } from "./table";
import { DungeonRunAnalysis } from "@/analysis-runs/types";

export function MaxAccuracyPanel() {
  return (
    <StudyPanel
      analysis={DungeonRunAnalysis.MaxAccuracy}
      columns={MAX_ACCURACY_TABLE_COLUMNS}
      tableConstructor={MaxAccuracyTable}
    />
  );
}
