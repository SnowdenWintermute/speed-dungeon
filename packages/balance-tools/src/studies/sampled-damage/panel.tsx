import { GenerateEquipmentRequirements } from "../../components/generate-equipment-requirements.tsx";
import { GenerateMonsterArmorClass } from "../../components/generate-monster-armor-class.tsx";
import { StudyPanel } from "../../components/study-panel.tsx";
import { DESIGNED_OFFENSIVE_ALLOCATION_PERCENTAGE } from "../../tuning-consts.ts";
import { StudyName } from "../study-name.ts";
import { SAMPLED_DAMAGE_TABLE_COLUMNS } from "./columns.tsx";
import { SampledDamageTable } from "./table.ts";

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
      defaultAllocationIntensity={DESIGNED_OFFENSIVE_ALLOCATION_PERCENTAGE}
      renderTableActions={(table) => (
        <>
          <GenerateEquipmentRequirements studyName={studyName} table={table} />
          <GenerateMonsterArmorClass table={table} />
        </>
      )}
    />
  );
}
