import {
  AdventuringParty,
  Combatant,
  CombatantId,
  CombatAttribute,
  Equipment,
  invariant,
} from "@speed-dungeon/common";
import {
  EquipmentBaseItemTally,
  TalliedBaseItem,
} from "../analysis-subjects/equipment-base-item-tally.ts";

/** What every study records about a character, whatever else its own report adds. */
export interface AnalysisCombatantReport {
  mainClassLevel: number;
  supportClassLevel: number | undefined;
  /**
   * Read off the combatant rather than summed from any study's per-source attribution: those floor
   * each source separately and never re-sum to the total.
   */
  totalAttributes: Record<CombatAttribute, number>;
}

export interface AnalysisRoomReport<TCombatantReport> {
  /** every base item dropped since the run began, not only this room's drops */
  cumulativeAvailableEquipment: TalliedBaseItem[];
  combatantReports: Map<CombatantId, TCombatantReport>;
}

export type RunReport<TCombatantReport> = {
  floor: number;
  room: number;
  roomReport: AnalysisRoomReport<TCombatantReport>;
}[];

export interface AnalysisRunReporter<TCombatantReport> {
  updateReport(
    goalPerformanceByCharacter: Map<CombatantId, number>,
    equipmentDroppedThisRoom: Equipment[]
  ): void;
  runReport: RunReport<TCombatantReport>;
}

/**
 * Owns the parts of a report that do not vary by study: where the room was, what had dropped by the
 * time the party stood in it, and one entry per party member. A study supplies only what it measures
 * about a character.
 */
export abstract class RoomReportingRunReporter<TCombatantReport extends AnalysisCombatantReport>
  implements AnalysisRunReporter<TCombatantReport>
{
  private _runReport: RunReport<TCombatantReport> = [];
  private cumulativeAvailableEquipment = new EquipmentBaseItemTally();

  constructor(protected party: AdventuringParty) {}

  get runReport() {
    return this._runReport;
  }

  protected abstract getCombatantReport(
    combatant: Combatant,
    goalPerformance: number
  ): TCombatantReport;

  /** spread by each study's report, so what every study records is written in one place */
  protected commonCombatantFields(combatant: Combatant): AnalysisCombatantReport {
    const { classProgressionProperties, attributeProperties } = combatant.getCombatantProperties();
    return {
      mainClassLevel: classProgressionProperties.getMainClass().level,
      supportClassLevel: classProgressionProperties.getSupportClassOption()?.level,
      totalAttributes: attributeProperties.getTotalAttributes(),
    };
  }

  updateReport(
    goalPerformanceByCharacter: Map<CombatantId, number>,
    equipmentDroppedThisRoom: Equipment[]
  ) {
    this.cumulativeAvailableEquipment.addAllEquipment(equipmentDroppedThisRoom);

    const combatantReports = new Map<CombatantId, TCombatantReport>();
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      const goalPerformance = goalPerformanceByCharacter.get(combatant.getEntityId());
      invariant(goalPerformance !== undefined);
      combatantReports.set(
        combatant.getEntityId(),
        this.getCombatantReport(combatant, goalPerformance)
      );
    }

    const { dungeonExplorationManager } = this.party;
    this._runReport.push({
      floor: dungeonExplorationManager.getCurrentFloor(),
      room: dungeonExplorationManager.getCurrentRoomNumber(),
      roomReport: {
        cumulativeAvailableEquipment: this.cumulativeAvailableEquipment.entries(),
        combatantReports,
      },
    });
  }
}
