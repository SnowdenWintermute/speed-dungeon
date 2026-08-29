import { AnalysisCharacterSpecification } from "../../analysis-subjects/analysis-character-specification.ts";
import { CombatantAttributesMemo } from "../../analysis-subjects/combatant-attributes-memo.ts";
import {
  ActionRank,
  ActionUserHeldWeapons,
  ArrayUtils,
  COMBAT_ACTIONS,
  CombatActionComponent,
  CombatActionHitOutcomes,
  CombatActionResource,
  Combatant,
  CombatantId,
  DEEPEST_FLOOR,
  EquipmentSlotId,
  getAttackActionName,
  getOffhandAttackActionNameOption,
  HitOutcomeCalculator,
  HitOutcomeMitigationCalculator,
  IncomingResourceChangesCalculator,
  invariant,
  RandomNumberGenerationPolicyFactory,
  RealResourceChangePropertiesStrategy,
  SeededNumberGenerator,
  TargetDummyFactory,
} from "@speed-dungeon/common";
import {
  GoalPerformance,
  GoalPerformanceChecker,
  GoalPerformanceCheckerType,
} from "../../goal-performance-checkers/index.ts";

/** the counts are raw so a caller pooling several of these divides once, at the end */
export interface SampledAttacksOnTargetDummy {
  averageDamage: number;
  /** off hand swings are excluded from every count */
  mainHandSwingCount: number;
  mainHandLandedHitCount: number;
  mainHandCriticalHitCount: number;
}

export class SampledDamageOnTargetDummyGoalPerformanceChecker implements GoalPerformanceChecker {
  readonly type = GoalPerformanceCheckerType.SampledAttackDamageOnTargetDummy;
  // when rolling attacks on the target dummy to check effectiveness of an equipment, we want to
  // use the same rolls for each equipment tried on or else lucky attack rolls might make an equipment
  // seem better than it really is
  private rng = SeededNumberGenerator.withRandomSeed();
  private rngPolicy = RandomNumberGenerationPolicyFactory.policyFromGenerator(this.rng);
  private resourceChangePropertiesStrategy = new RealResourceChangePropertiesStrategy();
  private targetDummyFactory = new TargetDummyFactory();
  private targetDummiesByFloor = new Map<number, Combatant>();
  private attributesMemosByCombatantId = new Map<CombatantId, CombatantAttributesMemo>();

  constructor() {
    this.initializeTargetDummies();
  }

  private sampleCount = 5;

  beginComparisonScope() {
    this.rng.setRandomSeed();
  }

  private initializeTargetDummies() {
    for (let floor = 1; floor <= DEEPEST_FLOOR; floor += 1) {
      const targetDummy = this.targetDummyFactory.createOnFloor(floor);
      new CombatantAttributesMemo(targetDummy).holdIndefinitely();
      this.targetDummiesByFloor.set(floor, targetDummy);
    }
  }

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

  private getAttackActions(combatant: Combatant, weapons: ActionUserHeldWeapons) {
    const mainHandEquipmentOption = weapons[EquipmentSlotId.MainHand];
    // read from the slot, not from `weapons`: getWeaponsInSlots drops anything that is not a weapon,
    // so a shield is absent there and the isShield check inside would never fire
    const offhandEquipmentOption = combatant
      .getCombatantProperties()
      .equipment.getEquipmentInSlot(EquipmentSlotId.OffHand);
    const mainHandAttackActionName = getAttackActionName(
      mainHandEquipmentOption?.weaponProperties,
      { isOffHand: false }
    );
    const offhandAttackActionNameOption = getOffhandAttackActionNameOption(
      mainHandEquipmentOption?.equipment,
      offhandEquipmentOption ?? undefined
    );

    return {
      mainHand: COMBAT_ACTIONS[mainHandAttackActionName],
      offHand:
        offhandAttackActionNameOption === null
          ? null
          : COMBAT_ACTIONS[offhandAttackActionNameOption],
    };
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
        this.rng
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
      this.rngPolicy,
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

    const { averageDamage } = this.sampleAttacksOnTargetDummy(combatant, partyCurrentFloor);

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
  sampleAttacksOnTargetDummy(combatant: Combatant, partyCurrentFloor: number) {
    // the combatant does not change while it is being sampled
    return this.requireAttributesMemo(combatant).holdWhile(() =>
      this.rollAttackSamples(combatant, partyCurrentFloor)
    );
  }

  private rollAttackSamples(
    combatant: Combatant,
    partyCurrentFloor: number
  ): SampledAttacksOnTargetDummy {
    this.rng.reset();

    const targetDummy = this.targetDummiesByFloor.get(partyCurrentFloor);
    invariant(targetDummy !== undefined, "no target dummy");

    const weapons = combatant.getWeaponsInSlots(
      [EquipmentSlotId.MainHand, EquipmentSlotId.OffHand],
      { usableWeaponsOnly: true }
    );

    const attackActions = this.getAttackActions(combatant, weapons);

    const ATTACK_ACTION_RANK = 1 as ActionRank;

    const damageSamples: number[] = [];
    let mainHandLandedHitCount = 0;
    let mainHandCriticalHitCount = 0;
    for (let sampleIndex = 0; sampleIndex < this.sampleCount; sampleIndex += 1) {
      const mainHandOutcome = this.sampleActionOutcome(
        combatant,
        attackActions.mainHand,
        ATTACK_ACTION_RANK,
        targetDummy
      );
      if (mainHandOutcome.landedHit) {
        mainHandLandedHitCount += 1;
      }
      if (mainHandOutcome.isCrit) {
        mainHandCriticalHitCount += 1;
      }

      let totalDamageForThisSample = mainHandOutcome.damage;
      if (attackActions.offHand !== null) {
        totalDamageForThisSample += this.sampleActionOutcome(
          combatant,
          attackActions.offHand,
          ATTACK_ACTION_RANK,
          targetDummy
        ).damage;
      }

      damageSamples.push(totalDamageForThisSample);
    }

    return {
      averageDamage: ArrayUtils.average(damageSamples),
      mainHandSwingCount: this.sampleCount,
      mainHandLandedHitCount,
      mainHandCriticalHitCount,
    };
  }
}
