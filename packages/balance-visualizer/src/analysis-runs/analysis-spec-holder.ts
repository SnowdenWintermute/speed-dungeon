import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { CombatantId, invariant } from "@speed-dungeon/common";

export class AnalysisSpecHolder {
  constructor(
    private _analysisSpecsByCombatantId: Map<CombatantId, AnalysisCharacterSpecification>
  ) {}

  get analysisSpecsByCombatantId() {
    return this._analysisSpecsByCombatantId;
  }

  requireSpec(combatantId: CombatantId) {
    const specOption = this._analysisSpecsByCombatantId.get(combatantId);
    invariant(specOption !== undefined, "no spec by that id");
    return specOption;
  }

  mergeFromOther(other: AnalysisSpecHolder) {
    for (const [combatantId, spec] of other.analysisSpecsByCombatantId) {
      this._analysisSpecsByCombatantId.set(combatantId, spec);
    }
  }
}
