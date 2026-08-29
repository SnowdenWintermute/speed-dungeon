import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { CombatantId, invariant } from "@speed-dungeon/common";
import { GoalPerformanceChecker } from "../goal-performance-checkers/index.ts";
import { GoalPerformanceCheckerConstructor } from "../goal-performance-checkers/constructors.ts";
import {
  AnalysisGoal,
  ANALYSIS_GOAL_SPECS,
} from "../goal-performance-checkers/analysis-goal.ts";
import { SeededRandomNumberGeneratorScopeProvider } from "./seeded-random-number-generator-scope-provider.ts";
import { TargetDummyProvider } from "./target-dummy-provider.ts";

export class AnalysisSpecContext {
  private scopeProvider = new SeededRandomNumberGeneratorScopeProvider();
  private goalPerformanceCheckersByGoal = new Map<AnalysisGoal, GoalPerformanceChecker>();

  constructor(
    private _analysisSpecsByCombatantId: Map<CombatantId, AnalysisCharacterSpecification>,
    constructGoalPerformanceChecker: GoalPerformanceCheckerConstructor
  ) {
    this.buildGoalPerformanceCheckers(constructGoalPerformanceChecker);
    this.throwIfScoreUnitsDisagree();
  }

  /**
   * Loot goes to whichever character a candidate improves most, which compares their scores against
   * each other. Until there are conversion ratios between units that only means anything when the
   * party shares one, and a study configuration that mixes them is a bug worth hearing about before
   * the first room rather than after forty.
   */
  private throwIfScoreUnitsDisagree() {
    const unitsInParty = new Set(
      this.getGoalPerformanceCheckers().map((checker) => checker.scoreUnit)
    );
    invariant(
      unitsInParty.size <= 1,
      "every goal in a party must score in the same unit to be weighed against the others"
    );
  }

  /**
   * One checker per goal the party holds rather than one per character, so characters chasing the
   * same thing are scored against the same rolls and the same target dummies.
   */
  private buildGoalPerformanceCheckers(
    constructGoalPerformanceChecker: GoalPerformanceCheckerConstructor
  ) {
    const resources = {
      scopeProvider: this.scopeProvider,
      targetDummyProvider: new TargetDummyProvider(),
    };

    for (const { goal } of this._analysisSpecsByCombatantId.values()) {
      if (this.goalPerformanceCheckersByGoal.has(goal)) {
        continue;
      }
      this.goalPerformanceCheckersByGoal.set(
        goal,
        constructGoalPerformanceChecker(ANALYSIS_GOAL_SPECS[goal], resources)
      );
    }
  }

  get analysisSpecsByCombatantId() {
    return this._analysisSpecsByCombatantId;
  }

  getScopeProvider() {
    return this.scopeProvider;
  }

  getGoalPerformanceCheckers() {
    return [...this.goalPerformanceCheckersByGoal.values()];
  }

  requireSpec(combatantId: CombatantId) {
    const specOption = this._analysisSpecsByCombatantId.get(combatantId);
    invariant(specOption !== undefined, "no spec by that id");
    return specOption;
  }

  requireGoalPerformanceChecker(combatantId: CombatantId) {
    const checkerOption = this.goalPerformanceCheckersByGoal.get(this.requireSpec(combatantId).goal);
    invariant(checkerOption !== undefined, "no goal performance checker for that spec");
    return checkerOption;
  }
}
