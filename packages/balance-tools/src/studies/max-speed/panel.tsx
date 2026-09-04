import { StudyPanel } from "../../components/study-panel.tsx";
import { StudyName } from "../study-name.ts";
import { MAX_SPEED_TABLE_COLUMNS } from "./columns.tsx";
import { MaxSpeedTable } from "./table.ts";

export function MaxSpeedPanel() {
  return (
    <StudyPanel
      studyName={StudyName.MaxSpeedMixed}
      columns={MAX_SPEED_TABLE_COLUMNS}
      tableConstructor={MaxSpeedTable}
    />
  );
}
