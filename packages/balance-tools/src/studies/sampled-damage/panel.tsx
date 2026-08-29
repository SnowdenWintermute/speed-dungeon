import { StudyPanel } from "../../components/study-panel.tsx";
import { StudyName } from "../study-name.ts";
import { SAMPLED_DAMAGE_TABLE_COLUMNS } from "./columns.tsx";
import { SampledDamageTable } from "./table.ts";
import { GenerateEquipmentRequirements } from "./generate-equipment-requirements.tsx";

const STUDY_NAME = StudyName.AttackDamageMixed;

export function AttackDamagePanel() {
  return (
    <StudyPanel
      studyName={STUDY_NAME}
      columns={SAMPLED_DAMAGE_TABLE_COLUMNS}
      tableConstructor={SampledDamageTable}
      defaultAllocationIntensity={0.6}
      renderTableActions={(table) => (
        <GenerateEquipmentRequirements studyName={STUDY_NAME} table={table} />
      )}
    />
  );
}
