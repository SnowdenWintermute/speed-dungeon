import { StudyPanel } from "../../components/study-panel.tsx";
import { GenerateMonsterEvasion } from "../../components/generate-monster-evasion.tsx";
import { StudyName } from "../study-name.ts";
import { MAX_ACCURACY_TABLE_COLUMNS } from "./columns.tsx";
import { MaxAccuracyTable } from "./table.ts";

export function MaxAccuracyPanel() {
  return (
    <StudyPanel
      studyName={StudyName.MaxAccuracyMixed}
      columns={MAX_ACCURACY_TABLE_COLUMNS}
      tableConstructor={MaxAccuracyTable}
      renderTableActions={(table) => <GenerateMonsterEvasion table={table} />}
    />
  );
}
