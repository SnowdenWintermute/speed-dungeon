import { FloorNumber, RoomNumber } from "@speed-dungeon/common";
import { attackDamageAnalysisRun } from ".";
import { AttackDamageRoomReport, RunReport } from "../analysis-run-reporter";
import { AnalysisSpecHolder } from "../analysis-spec-holder";

export class AttackDamageRunSet {
  private reports: RunReport<AttackDamageRoomReport>[] = [];
  private specHolder = new AnalysisSpecHolder(new Map());
  private aggregatedBySpec = new Map<FloorNumber, Map<RoomNumber, null>>();

  private aggregateReports() {
    for (const report of this.reports) {
      for (const labledRoomReport of report) {
        const { room, floor, roomReport } = labledRoomReport;

        const { combatantReports, unusedEquipmentTypeCounts } = roomReport;

        for (const [combatantId, combatantReport] of combatantReports) {
          const combatantSpec = this.specHolder.requireSpec(combatantId);
          const {
            tooltipDamage,
            heldEquipment,
            contributingAllocations,
            mainClassLevel,
            supportClassLevel,
            sampledDamageOnDummy,
          } = combatantReport;
        }
      }
    }
  }

  executeSet(runCount: number) {
    for (let i = 0; i < runCount; i += 1) {
      try {
        const { report, analysisSpecsHolder } = attackDamageAnalysisRun();
        this.specHolder.mergeFromOther(analysisSpecsHolder);

        this.reports.push(report);
      } catch (probablyError) {
        console.error(probablyError);
      }
    }
  }
}
