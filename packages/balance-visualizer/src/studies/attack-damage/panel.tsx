import { StudyPanel } from "@/components/study-panel";
import { ATTACK_DAMAGE_TABLE_COLUMNS } from "./columns";
import { AttackDamageTable } from "./table";
import { DungeonRunAnalysis } from "@/analysis-runs/types";

export function AttackDamagePanel() {
  return (
    <StudyPanel
      analysis={DungeonRunAnalysis.AttackDamage}
      columns={ATTACK_DAMAGE_TABLE_COLUMNS}
      tableConstructor={AttackDamageTable}
    />
  );
}
