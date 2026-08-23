import { AnalysisRun } from "../analysis-runs";
import {
  AttackDamageRoomReport,
  AttackDamageRunReporter,
} from "../analysis-runs/analysis-run-reporter";
import { BestImprovementEquipmentSolver } from "../solvers/best-improvement";
import { CombatAttribute } from "@speed-dungeon/common";
import { AttributeAllocationSolver } from "../solvers/attribute-allocation";
import { AnalysisPartyBuilder } from "@/analysis-runs/analysis-party-builder";

export function testAnalysisRun() {
  const { game, party } = new AnalysisPartyBuilder().buildPartyInGame();

  const runner = new AnalysisRun<AttackDamageRoomReport>(
    game,
    party,
    new BestImprovementEquipmentSolver(party, () => 1, [() => 1]),
    new AttributeAllocationSolver(party, () => 1, [CombatAttribute.Strength]),
    new AttackDamageRunReporter(party)
  );

  const report = runner.simulateRun();
  console.log(report);
}
