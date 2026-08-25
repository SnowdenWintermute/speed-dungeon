import { DungeonRunAnalysis } from "@/analysis-runs/dungeon-run-analysis";
import { StudyPanel } from "@/components/StudyPanel";
import { ATTACK_DAMAGE_TABLE_COLUMNS } from "./columns";
import { AttackDamageTable } from "./table";

export function AttackDamagePanel() {
  return (
    <StudyPanel
      analysis={DungeonRunAnalysis.AttackDamage}
      columns={ATTACK_DAMAGE_TABLE_COLUMNS}
      tableConstructor={AttackDamageTable}
    />
  );
}
