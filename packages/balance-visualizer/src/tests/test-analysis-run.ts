import { AnalysisRun } from "../analysis-runs";
import {
  AttackDamageRoomReport,
  AttackDamageRunReporter,
} from "../analysis-runs/analysis-run-reporter";
import { BestImprovementEquipmentSolver } from "../solvers/best-improvement";
import {
  Combatant,
  CombatantClass,
  CombatAttribute,
  DEEPEST_FLOOR,
  invariant,
  TargetDummyFactory,
} from "@speed-dungeon/common";
import { AttributeAllocationSolver } from "../solvers/attribute-allocation";
import { AnalysisPartyBuilder } from "@/analysis-runs/analysis-party-builder";
import {
  AnalysisCharacterSpecification,
  CharacterWeaponSpecialty,
} from "@/analysis-subjects/analysis-character-specification";

export function testAnalysisRun() {
  const { game, party, analysisSpecsByCombatantId } = new AnalysisPartyBuilder().build([
    new AnalysisCharacterSpecification("character 1", {
      mainClass: CombatantClass.Warrior,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
    }),
  ]);

  const targetDummiesByFloor = new Map<number, Combatant>();
  for (let floor = 1; floor <= DEEPEST_FLOOR; floor += 1) {
    targetDummiesByFloor.set(floor, new TargetDummyFactory().createOnFloor(floor));
  }

  const goalPerformanceChecker = (combatant: Combatant, partyCurrentFloor: number) => {
    const spec = analysisSpecsByCombatantId.get(combatant.getEntityId());
    invariant(spec !== undefined);
    const notWearingSpecDesiredEquipmen = !spec.combatantIsWearingDesiredEquipmentType(combatant);
    if (notWearingSpecDesiredEquipmen) {
      return 0;
    }

    const targetDummy = targetDummiesByFloor.get(partyCurrentFloor);
    const sampleCount = 5;
    // sample damage on dummy

    return 0;
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
  console.log(report);
}
