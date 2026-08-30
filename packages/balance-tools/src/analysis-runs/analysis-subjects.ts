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
    constructGoalPerformanceChecker: GoalPerformanceCheckerConstructor
  ) {
    this.buildGoalPerformanceCheckers(constructGoalPerformanceChecker);
    this.assertScoreUnitsAgree();
  }

  /**
   * Loot goes to whichever character a candidate improves most, which compares their scores against
   * each other. Until there are conversion ratios between units that only means anything when the
   * party shares one, and a study configuration that mixes them is a bug worth hearing about before
   * the first room rather than after forty.
   */
  private assertScoreUnitsAgree() {
    const unitsInParty = new Set(
      [...this.goalPerformanceCheckersByGoal.values()].map((checker) => checker.scoreUnit)
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
      comparisonRollScope: this.comparisonRollScope,
      targetDummyProvider: new TargetDummyProvider(),
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

  /**
   * Scores a combatant against its own goal, which is the only pairing that ever makes sense, and is
   * also where a score is paired with whether the character is holding what its build is defined by.
   * A checker only knows how to score; whether holding the specialty matters is declared once per
   * goal, so a goal that has no such equipment never has to say anything about it.
   */
  checkPerformance(combatant: Combatant, partyCurrentFloor: number): GoalPerformance {
    const combatantId = combatant.getEntityId();
    const analysisSpec = this.requireSpec(combatantId);
    const { buildIsDefinedByHeldEquipment } = ANALYSIS_GOAL_SPECS[analysisSpec.goal];

    return {
      score: this.requireGoalPerformanceChecker(combatantId).checkPerformance(
        combatant,
        partyCurrentFloor
      ),
      holdsBuildDefiningEquipment:
        !buildIsDefinedByHeldEquipment ||
        analysisSpec.combatantIsWearingDesiredEquipmentType(combatant),
    };
  }
}
