import { StudyPanel } from "@/components/study-panel";
import { StudyName } from "@/studies/study-name";
import { ATTACK_DAMAGE_TABLE_COLUMNS } from "./columns";
import { AttackDamageTable } from "./table";
import { GenerateEquipmentRequirements } from "./generate-equipment-requirements";

const STUDY_NAME = StudyName.AttackDamageMixed;

export function AttackDamagePanel() {
  return (
    <StudyPanel
      studyName={STUDY_NAME}
      columns={ATTACK_DAMAGE_TABLE_COLUMNS}
      tableConstructor={AttackDamageTable}
      defaultAllocationIntensity={0.6}
      renderTableActions={(table) => (
        <GenerateEquipmentRequirements studyName={STUDY_NAME} table={table} />
      )}
    />
  );
}
