import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { Combatant } from "@speed-dungeon/common";

export interface GoalPerformanceChecker {
  checkPerformance(
    combatant: Combatant,
    combatantAnalysisSpec: AnalysisCharacterSpecification,
    partyCurrentFloor: number
  ): number;
}
