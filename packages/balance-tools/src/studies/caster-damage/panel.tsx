import { StudyPanel } from "../../components/study-panel.tsx";
import { StudyName } from "../study-name.ts";
// the sampled damage analysis's table, which this study shares with the attack damage one: same
// columns, a different party. slice by goal to read the caster's rows apart from the weapon users'
import { SAMPLED_DAMAGE_TABLE_COLUMNS } from "../sampled-damage/columns.tsx";
import { SampledDamageTable } from "../sampled-damage/table.ts";
import { GenerateEquipmentRequirements } from "../sampled-damage/generate-equipment-requirements.tsx";

const STUDY_NAME = StudyName.CasterDamageMixed;

export function CasterDamagePanel() {
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
