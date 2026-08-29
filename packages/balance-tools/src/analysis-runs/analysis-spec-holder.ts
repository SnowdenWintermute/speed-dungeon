import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
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
}
