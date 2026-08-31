import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { Combatant, CombatantId, Equipment, invariant } from "@speed-dungeon/common";
import { GoalPerformance, GoalPerformanceChecker } from "../goal-performance-checkers/index.ts";
import { GoalPerformanceCheckerConstructor } from "../goal-performance-checkers/constructors.ts";
import { AnalysisGoal, ANALYSIS_GOAL_SPECS } from "../goal-performance-checkers/analysis-goal.ts";
import { ComparisonRollScope } from "./comparison-roll-scope.ts";
import { TargetDummyProvider } from "./target-dummy-provider.ts";

export class AnalysisSubjects {
  private comparisonRollScope = new ComparisonRollScope();
  private goalPerformanceCheckersByGoal = new Map<AnalysisGoal, GoalPerformanceChecker>();

  constructor(
    private analysisSpecsByCombatantId: Map<CombatantId, AnalysisCharacterSpecification>,
    constructGoalPerformanceChecker: GoalPerformanceCheckerConstructor,
    private targetDummiesHaveArmorClass: boolean
  ) {
    this.buildGoalPerformanceCheckers(constructGoalPerformanceChecker);
    this.assertGoalsScoreTheSameWay();
  }

  /**
   * Loot goes to whichever character a candidate improves most, which compares their scores against
   * each other. Until there are conversion ratios between them that only means anything when the
   * party's goals all score through one checker, and a study configuration that mixes them is a bug
   * worth hearing about before the first room rather than after forty.
   */
  private assertGoalsScoreTheSameWay() {
    const checkerTypesInParty = new Set(
      [...this.goalPerformanceCheckersByGoal.keys()].map(
        (goal) => ANALYSIS_GOAL_SPECS[goal].typeConfig.type
      )
    );
    invariant(
      checkerTypesInParty.size <= 1,
      "every goal in a party must score the same way to be weighed against the others"
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
      comparisonRollScope: this.comparisonRollScope,
      targetDummyProvider: new TargetDummyProvider(this.targetDummiesHaveArmorClass),
    };

    for (const { goal } of this.analysisSpecsByCombatantId.values()) {
      if (this.goalPerformanceCheckersByGoal.has(goal)) {
        continue;
      }
      this.goalPerformanceCheckersByGoal.set(
        goal,
        constructGoalPerformanceChecker(ANALYSIS_GOAL_SPECS[goal], resources)
      );
    }
  }

  getComparisonRollScope() {
    return this.comparisonRollScope;
  }

  /**
   * Every axis any goal in the party scores on. Union, because an item is pruned when it scores on
   * none of them: scoring only the axes of one goal would delete the gear another was walking for.
   */
  getEquipmentScoreAxes() {
    const axes = new Set<(equipment: Equipment) => number>();
    for (const checker of this.goalPerformanceCheckersByGoal.values()) {
      for (const axis of checker.equipmentScoreAxes) {
        axes.add(axis);
      }
    }
    return [...axes];
  }

  requireSpec(combatantId: CombatantId) {
    const specOption = this.analysisSpecsByCombatantId.get(combatantId);
    invariant(specOption !== undefined, "no spec by that id");
    return specOption;
  }

  requireGoalPerformanceChecker(combatantId: CombatantId) {
    const checkerOption = this.goalPerformanceCheckersByGoal.get(this.requireSpec(combatantId).goal);
    invariant(checkerOption !== undefined, "no goal performance checker for that spec");
    return checkerOption;
  }

  checkPerformance(combatant: Combatant, partyCurrentFloor: number): GoalPerformance {
    const combatantId = combatant.getEntityId();
    const analysisSpec = this.requireSpec(combatantId);
    const { requiresHoldableSpecialty } = ANALYSIS_GOAL_SPECS[analysisSpec.goal];

    return {
      score: this.requireGoalPerformanceChecker(combatantId).checkPerformance(
        combatant,
        partyCurrentFloor
      ),
      isWearingHoldableSpecialty:
        !requiresHoldableSpecialty ||
        analysisSpec.combatantIsWearingDesiredEquipmentType(combatant),
    };
  }
}
