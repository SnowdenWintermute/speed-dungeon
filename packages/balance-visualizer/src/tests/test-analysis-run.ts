import { AnalysisRun } from "../analysis-runs";
import {
  AttackDamageRoomReport,
  AttackDamageRunReporter,
} from "../analysis-runs/analysis-run-reporter";
import { BestImprovementEquipmentSolver } from "../solvers/best-improvement";
import {
  ActionRank,
  ArrayUtils,
  BasicRandomNumberGenerator,
  COMBAT_ACTIONS,
  CombatActionComponent,
  CombatActionHitOutcomes,
  CombatActionResource,
  Combatant,
  CombatantClass,
  CombatantId,
  CombatAttribute,
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
  ResourceChangeSource,
  TargetDummyFactory,
} from "@speed-dungeon/common";
import { AttributeAllocationSolver } from "../solvers/attribute-allocation";
import { AnalysisPartyBuilder } from "@/analysis-runs/analysis-party-builder";
import {
  AnalysisCharacterSpecification,
  CharacterWeaponSpecialty,
} from "@/analysis-subjects/analysis-character-specification";
import { CombatantAttributesMemo } from "@/analysis-subjects/combatant-attributes-memo";

export function testAnalysisRun() {
  const { game, party, analysisSpecsByCombatantId } = new AnalysisPartyBuilder().build([
    new AnalysisCharacterSpecification("character 1", {
      mainClass: CombatantClass.Warrior,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
    }),
  ]);

  const rng = new BasicRandomNumberGenerator();
  const resourceChangePropertiesStrategy = new RealResourceChangePropertiesStrategy();

  const targetDummiesByFloor = new Map<number, Combatant>();
  for (let floor = 1; floor <= DEEPEST_FLOOR; floor += 1) {
    const targetDummy = new TargetDummyFactory().createOnFloor(floor);
    new CombatantAttributesMemo(targetDummy).holdIndefinitely();
    targetDummiesByFloor.set(floor, targetDummy);
  }

  const attributesMemosByCharacterId = new Map<CombatantId, CombatantAttributesMemo>();
  for (const character of party.combatantManager.getPartyMemberCharacters()) {
    attributesMemosByCharacterId.set(
      character.getEntityId(),
      new CombatantAttributesMemo(character)
    );
  }

  const sampleAverageDamageOnDummy = (combatant: Combatant, partyCurrentFloor: number) => {
    const spec = analysisSpecsByCombatantId.get(combatant.getEntityId());
    invariant(spec !== undefined);
    const notWearingSpecDesiredEquipment = !spec.combatantIsWearingDesiredEquipmentType(combatant);
    if (notWearingSpecDesiredEquipment) {
      return 0;
    }

    const targetDummy = targetDummiesByFloor.get(partyCurrentFloor);
    invariant(targetDummy !== undefined, "no target dummy");

    const weapons = combatant.getWeaponsInSlots(
      [EquipmentSlotId.MainHand, EquipmentSlotId.OffHand],
      { usableWeaponsOnly: true }
    );
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
    let offhandAttackActionOption: undefined | CombatActionComponent = undefined;
    if (offhandAttackActionNameOption !== null) {
      offhandAttackActionOption = COMBAT_ACTIONS[offhandAttackActionNameOption];
    }

    const sampleCount = 5;
    const ATTACK_ACTION_RANK = 1 as ActionRank;
    // sample damage on dummy
    const samples: number[] = [];
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const mhHitOutcomeProperties = mainhandAttackAction.hitOutcomeProperties;
      const incomingRolledMainhand =
        IncomingResourceChangesCalculator.rollBaseIncomingResourceChangesOnPrimaryTarget(
          combatant,
          mhHitOutcomeProperties,
          ATTACK_ACTION_RANK,
          targetDummy.combatantProperties,
          CombatActionResource.HitPoints,
          resourceChangePropertiesStrategy.getResourceChangePropertiesGetters(
            mainHandAttackActionName
          ),
          rng
        );

      invariant(incomingRolledMainhand !== null, "expect mainhand attack to roll incoming damage");

      const incomingResourceChanges: Partial<
        Record<
          CombatActionResource,
          {
            valuePerTarget: number;
            source: ResourceChangeSource;
          }
        >
      > = {
        [CombatActionResource.HitPoints]: {
          valuePerTarget: incomingRolledMainhand.rolled,
          source: incomingRolledMainhand.resourceChangeProperties.resourceChangeSource,
        },
      };

      const mitigationCalculator = new HitOutcomeMitigationCalculator(
        mainhandAttackAction,
        ATTACK_ACTION_RANK,
        combatant,
        targetDummy,
        incomingResourceChanges,
        RandomNumberGenerationPolicyFactory.allRandomPolicy(),
        new RealResourceChangePropertiesStrategy()
      );

      const hitOutcomes = new CombatActionHitOutcomes();
      HitOutcomeCalculator.calculateHitOutcomesOnTarget(
        targetDummy,
        mitigationCalculator,
        incomingResourceChanges,
        ATTACK_ACTION_RANK,
        hitOutcomes
      );

      const finalDamage = Math.abs(
        hitOutcomes.resourceChanges?.[CombatActionResource.HitPoints]?.getRecords()[0]?.[1].value ||
          0
      );

      samples.push(finalDamage);
    }

    return ArrayUtils.average(samples);
  };

  const goalPerformanceChecker = (combatant: Combatant, partyCurrentFloor: number) => {
    const attributesMemo = attributesMemosByCharacterId.get(combatant.getEntityId());
    invariant(attributesMemo !== undefined, "expected an attributes memo for the character");
    return attributesMemo.holdWhile(() => sampleAverageDamageOnDummy(combatant, partyCurrentFloor));
  };

  const runner = new AnalysisRun<AttackDamageRoomReport>(
    game,
    party,
    new BestImprovementEquipmentSolver(party, analysisSpecsByCombatantId, goalPerformanceChecker, [
      () => 1,
    ]),
    new AttributeAllocationSolver(party, goalPerformanceChecker, [CombatAttribute.Strength]),
    new AttackDamageRunReporter(party)
  );

  const report = runner.simulateRun();
  // console.log(report);
}
