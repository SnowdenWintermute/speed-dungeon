import { StudyPanel } from "../../components/study-panel.tsx";
import { StudyName } from "../study-name.ts";
import { MAX_AGILITY_TABLE_COLUMNS } from "./columns.tsx";
import { MaxAgilityTable } from "./table.ts";

export function MaxAgilityPanel() {
  return (
    <StudyPanel
      studyName={StudyName.MaxAgilityGroupThree}
      columns={MAX_AGILITY_TABLE_COLUMNS}
      tableConstructor={MaxAgilityTable}
    />
  );
}
