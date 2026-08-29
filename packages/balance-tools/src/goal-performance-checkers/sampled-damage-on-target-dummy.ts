import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { CombatantAttributesMemo } from "../analysis-subjects/combatant-attributes-memo.ts";
import {
  ActionRank,
  ArrayUtils,
  AttributePointAssignableAttributes,
  CombatActionComponent,
  CombatActionHitOutcomes,
  CombatActionResource,
  Combatant,
  CombatantId,
  Equipment,
  HitOutcomeCalculator,
  HitOutcomeMitigationCalculator,
  IncomingResourceChangesCalculator,
  invariant,
  RealResourceChangePropertiesStrategy,
} from "@speed-dungeon/common";
import { GoalPerformance, GoalPerformanceChecker, GoalPerformanceUnit } from "./index.ts";
import { SampledActionSelector } from "./sampled-action-selection.ts";
import { SeededRandomNumberGeneratorScopeProvider } from "../analysis-runs/seeded-random-number-generator-scope-provider.ts";
import { TargetDummyProvider } from "../analysis-runs/target-dummy-provider.ts";

/** the counts are raw so a caller pooling several of these divides once, at the end */
export interface SampledActionsOnTargetDummy {
  averageDamage: number;
  /** every count covers the primary action only, never the additional ones sampled alongside it */
  primaryUseCount: number;
  primaryLandedHitCount: number;
  primaryCriticalHitCount: number;
}

export class SampledDamageOnTargetDummyGoalPerformanceChecker implements GoalPerformanceChecker {
  readonly scoreUnit = GoalPerformanceUnit.SampledDamage;
  private resourceChangePropertiesStrategy = new RealResourceChangePropertiesStrategy();
  private attributesMemosByCombatantId = new Map<CombatantId, CombatantAttributesMemo>();

  constructor(
    private selectActions: SampledActionSelector,
    readonly allocatableAttributes: AttributePointAssignableAttributes[],
    readonly equipmentScoreAxes: ((equipment: Equipment) => number)[],
    private scopeProvider: SeededRandomNumberGeneratorScopeProvider,
    private targetDummyProvider: TargetDummyProvider
  ) {}

  private sampleCount = 5;

  private requireAttributesMemo(combatant: Combatant) {
    const combatantId = combatant.getEntityId();
    const existing = this.attributesMemosByCombatantId.get(combatantId);
    if (existing !== undefined) {
      return existing;
    }
    const created = new CombatantAttributesMemo(combatant);
    this.attributesMemosByCombatantId.set(combatantId, created);
    return created;
  }

  private sampleActionOutcome(
    user: Combatant,
    action: CombatActionComponent,
    actionRank: ActionRank,
    targetDummy: Combatant
  ) {
    const { hitOutcomeProperties } = action;
    const incomingRolledDamage =
      IncomingResourceChangesCalculator.rollBaseIncomingResourceChangesOnPrimaryTarget(
        user,
        hitOutcomeProperties,
        actionRank,
        targetDummy.combatantProperties,
        CombatActionResource.HitPoints,
        this.resourceChangePropertiesStrategy.getResourceChangePropertiesGetters(action.name),
        this.scopeProvider.getGenerator()
      );
    invariant(incomingRolledDamage !== null, "expect attack action to roll incoming damage");

    const incomingResourceChanges = {
      [CombatActionResource.HitPoints]: {
        valuePerTarget: incomingRolledDamage.rolled,
        source: incomingRolledDamage.resourceChangeProperties.resourceChangeSource,
      },
    };

    const mitigationCalculator = new HitOutcomeMitigationCalculator(
      action,
      actionRank,
      user,
      targetDummy,
      incomingResourceChanges,
      this.scopeProvider.getPolicy(),
      this.resourceChangePropertiesStrategy
    );
    const hitOutcomes = new CombatActionHitOutcomes();
    HitOutcomeCalculator.calculateHitOutcomesOnTarget(
      targetDummy,
      mitigationCalculator,
      incomingResourceChanges,
      actionRank,
      hitOutcomes
    );

    const hitPointChangeOption =
      hitOutcomes.resourceChanges?.[CombatActionResource.HitPoints]?.getRecords()[0]?.[1];

    // the calculator writes no resource change when the swing was not a hit, so the record standing
    // in for the swing landing is the same thing that says whether it crit
    return {
      damage: Math.abs(hitPointChangeOption?.value || 0),
      landedHit: hitPointChangeOption !== undefined,
      isCrit: hitPointChangeOption?.isCrit ?? false,
    };
  }

  checkPerformance(
    combatant: Combatant,
    combatantAnalysisSpec: AnalysisCharacterSpecification,
    partyCurrentFloor: number
  ): GoalPerformance {
    invariant(combatantAnalysisSpec !== undefined);

    const { averageDamage } = this.sampleActionsOnTargetDummy(combatant, partyCurrentFloor);

    return {
      score: averageDamage,
      meetsBuildSpecification:
        combatantAnalysisSpec.combatantIsWearingDesiredEquipmentType(combatant),
    };
  }

  /**
   * The rolls reset with every call, so sampling a combatant that has not changed since its
   * performance was checked reproduces the very attacks that performance was read from.
   */
  /** what this goal has the combatant using, so a report can quote tooltips for the same actions */
  getSampledActions(combatant: Combatant) {
    return this.selectActions(combatant);
  }

  sampleActionsOnTargetDummy(combatant: Combatant, partyCurrentFloor: number) {
    // the combatant does not change while it is being sampled
    return this.requireAttributesMemo(combatant).holdWhile(() =>
      this.rollSamples(combatant, partyCurrentFloor)
    );
  }

  private rollSamples(
    combatant: Combatant,
    partyCurrentFloor: number
  ): SampledActionsOnTargetDummy {
    this.scopeProvider.rewindToScopeStart();

    const targetDummy = this.targetDummyProvider.requireForFloor(partyCurrentFloor);
    const { primary, additional } = this.selectActions(combatant);

    const damageSamples: number[] = [];
    let primaryLandedHitCount = 0;
    let primaryCriticalHitCount = 0;
    for (let sampleIndex = 0; sampleIndex < this.sampleCount; sampleIndex += 1) {
      const primaryOutcome = this.sampleActionOutcome(
        combatant,
        primary.action,
        primary.rank,
        targetDummy
      );
      if (primaryOutcome.landedHit) {
        primaryLandedHitCount += 1;
      }
      if (primaryOutcome.isCrit) {
        primaryCriticalHitCount += 1;
      }

      let totalDamageForThisSample = primaryOutcome.damage;
      for (const { action, rank } of additional) {
        totalDamageForThisSample += this.sampleActionOutcome(
          combatant,
          action,
          rank,
          targetDummy
        ).damage;
      }

      damageSamples.push(totalDamageForThisSample);
    }

    return {
      averageDamage: ArrayUtils.average(damageSamples),
      primaryUseCount: this.sampleCount,
      primaryLandedHitCount,
      primaryCriticalHitCount,
    };
  }
}
