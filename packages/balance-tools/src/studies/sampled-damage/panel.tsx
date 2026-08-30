import { StudyPanel } from "../../components/study-panel.tsx";
import { StudyName } from "../study-name.ts";
import { SAMPLED_DAMAGE_TABLE_COLUMNS } from "./columns.tsx";
import { SampledDamageTable } from "./table.ts";
import { GenerateEquipmentRequirements } from "./generate-equipment-requirements.tsx";

type SampledDamageStudyName =
  | StudyName.CasterDualWieldRanged
  | StudyName.AttackDamageGroupOne
  | StudyName.CasterDamageMixed
  | StudyName.MixedDamageGroupThree;

export function SampledDamagePanel(studyName: SampledDamageStudyName) {
  return (
    <StudyPanel
      studyName={studyName}
      columns={SAMPLED_DAMAGE_TABLE_COLUMNS}
      tableConstructor={SampledDamageTable}
      defaultAllocationIntensity={0.6}
      renderTableActions={(table) => (
        <GenerateEquipmentRequirements studyName={studyName} table={table} />
      )}
    />
  );
}
