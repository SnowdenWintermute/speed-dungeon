import { StudyPanel } from "../../components/study-panel.tsx";
import { StudyName } from "../study-name.ts";
import { ARMOR_CLASS_TABLE_COLUMNS } from "./columns.tsx";
import { ArmorClassTable } from "./table.ts";

type ArmorClassStudyName = StudyName.ArmorClassMixed | StudyName.ArmorClassDualWield;

export function ArmorClassPanel(studyName: ArmorClassStudyName) {
  return (
    <StudyPanel
      studyName={studyName}
      columns={ARMOR_CLASS_TABLE_COLUMNS}
      tableConstructor={ArmorClassTable}
      // the copied attributes carry whatever intensity their source study was walked at; this one
      // only scales the armor class affixes this study's own party finds
      defaultAllocationIntensity={0.6}
      // what a build can wear is the whole question here: without the gates every character wears
      // whatever dropped, and the copied attributes it walks with stop meaning anything
      fixedHonorsEquipmentRequirements={true}
    />
  );
}
