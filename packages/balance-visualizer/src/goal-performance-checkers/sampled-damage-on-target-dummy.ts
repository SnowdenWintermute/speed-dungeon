import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { CombatantAttributesMemo } from "@/analysis-subjects/combatant-attributes-memo";
import {
  ActionRank,
  ActionUserHeldWeapons,
  ArrayUtils,
  BasicRandomNumberGenerator,
  COMBAT_ACTIONS,
  CombatActionComponent,
  CombatActionHitOutcomes,
  CombatActionResource,
  Combatant,
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
  TargetDummyFactory,
} from "@speed-dungeon/common";
import { GoalPerformanceChecker } from ".";

export class SampledDamageOnTargetDummyGoalPerformanceChecker implements GoalPerformanceChecker {
  private rng = new BasicRandomNumberGenerator();
  private rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
  private resourceChangePropertiesStrategy = new RealResourceChangePropertiesStrategy();
  private targetDummyFactory = new TargetDummyFactory();
  private targetDummiesByFloor = new Map<number, Combatant>();

  constructor() {
    this.initializeTargetDummies();
  }

  private sampleCount = 5;

  private initializeTargetDummies() {
    for (let floor = 1; floor <= DEEPEST_FLOOR; floor += 1) {
      const targetDummy = this.targetDummyFactory.createOnFloor(floor);
      new CombatantAttributesMemo(targetDummy).holdIndefinitely();
      this.targetDummiesByFloor.set(floor, targetDummy);
    }
  }

  private getAttackActions(weapons: ActionUserHeldWeapons) {
    const mainHandEquipmentOption = weapons[EquipmentSlotId.MainHand];
    const offhandEquipmentOption = weapons[EquipmentSlotId.OffHand];
    const mainHandAttackActionName = getAttackActionName(
      mainHandEquipmentOption?.weaponProperties,
      { isOffHand: false }
    );
    const offhandAttackActionNameOption = getOffhandAttackActionNameOption(
      mainHandEquipmentOption?.equipment,
      offhandEquipmentOption?.equipment
    );

    const mainhandAttackAction = COMBAT_ACTIONS[mainHandAttackActionName];

    const result = [mainhandAttackAction];

    if (offhandAttackActionNameOption !== null) {
      result.push(COMBAT_ACTIONS[offhandAttackActionNameOption]);
    }

    return result;
  }

  private sampleActionDamage(
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

    const finalDamage = Math.abs(
      hitOutcomes.resourceChanges?.[CombatActionResource.HitPoints]?.getRecords()[0]?.[1].value || 0
    );

    return finalDamage;
  }

  checkPerformance(
    combatant: Combatant,
    combatantAnalysisSpec: AnalysisCharacterSpecification,
    partyCurrentFloor: number
  ) {
    invariant(combatantAnalysisSpec !== undefined);
    const notWearingSpecDesiredEquipment =
      !combatantAnalysisSpec.combatantIsWearingDesiredEquipmentType(combatant);
    if (notWearingSpecDesiredEquipment) {
      return 0;
    }

    const targetDummy = this.targetDummiesByFloor.get(partyCurrentFloor);
    invariant(targetDummy !== undefined, "no target dummy");

    const weapons = combatant.getWeaponsInSlots(
      [EquipmentSlotId.MainHand, EquipmentSlotId.OffHand],
      { usableWeaponsOnly: true }
    );

    const attackActions = this.getAttackActions(weapons);

    const ATTACK_ACTION_RANK = 1 as ActionRank;

    const samples: number[] = [];
    for (let sampleIndex = 0; sampleIndex < this.sampleCount; sampleIndex += 1) {
      let totalDamageForThisSample = 0;
      for (const action of attackActions) {
        const finalDamage = this.sampleActionDamage(
          combatant,
          action,
          ATTACK_ACTION_RANK,
          targetDummy
        );

        totalDamageForThisSample += finalDamage;
      }

      samples.push(totalDamageForThisSample);
    }

    return ArrayUtils.average(samples);
  }
}
