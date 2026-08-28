import { StudyPanel } from "@/components/study-panel";
import { DungeonRunAnalysis } from "@/analysis-runs/dungeon-run-analysis";
import { StudyName } from "@/studies/study-name";
import { ATTACK_DAMAGE_TABLE_COLUMNS } from "./columns";
import { AttackDamageTable } from "./table";
import { GenerateEquipmentRequirements } from "./generate-equipment-requirements";

export function AttackDamagePanel({ studyName }: { studyName: StudyName }) {
  return (
    <StudyPanel
      studyName={studyName}
      analysis={DungeonRunAnalysis.AttackDamage}
      columns={ATTACK_DAMAGE_TABLE_COLUMNS}
      tableConstructor={AttackDamageTable}
      defaultAllocationIntensity={0.6}
      renderTableActions={(table) => (
        <GenerateEquipmentRequirements studyName={studyName} table={table} />
      )}
    />
  );
}
