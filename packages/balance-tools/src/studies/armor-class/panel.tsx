import { StudyPanel } from "../../components/study-panel.tsx";
import { StudyName } from "../study-name.ts";
import { ARMOR_CLASS_TABLE_COLUMNS } from "./columns.tsx";
import { ArmorClassTable } from "./table.ts";

type ArmorClassStudyName = StudyName.ArmorClassMixed | StudyName.ArmorClassGroupThree;

export function ArmorClassPanel(studyName: ArmorClassStudyName) {
  return (
    <StudyPanel
      studyName={studyName}
      columns={ARMOR_CLASS_TABLE_COLUMNS}
      tableConstructor={ArmorClassTable}
      // only scales the armor class affixes, since "allocation" on gear
      // means which affixes you select on that gear regardless of base item
      defaultAllocationIntensity={0.4}
      fixedHonorsEquipmentRequirements={true}
      // this study scores the party's own armor class, never damage against a dummy
      fixedTargetDummiesHaveArmorClass={false}
    />
  );
}
