import {
  AdventuringParty,
  Combatant,
  CombatantClass,
  CombatAttribute,
  Equipment,
  EquipmentSlotId,
  IdGeneratorSequential,
  invariant,
} from "@speed-dungeon/common";
import { BestImprovementEquipmentSolver } from "./best-improvement.ts";
import { EquipmentSolverTestItems, totalDexterity } from "./equipment-solver-test-items.ts";
import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import { AnalysisPartyBuilder } from "../analysis-runs/analysis-party-builder.ts";
import {
  GoalPerformanceChecker,
  GoalPerformanceUnit,
} from "../goal-performance-checkers/index.ts";
import { GoalPerformanceCheckerConstructor } from "../goal-performance-checkers/constructors.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";

const PARTY_CHARACTER_COUNT = 2;
const FINGER_SLOT_IDS = [EquipmentSlotId.FingerMain, EquipmentSlotId.FingerAlternate];

const dexterityPerformance: GoalPerformanceChecker = {
  scoreUnit: GoalPerformanceUnit.TotalAccuracy,
  allocatableAttributes: [CombatAttribute.Dexterity],
  equipmentScoreAxes: [totalDexterity],
  checkPerformance: (combatant: Combatant) => ({
    score: combatant.getTotalAttributes()[CombatAttribute.Dexterity] ?? 0,
    meetsBuildSpecification: true,
  }),
};

/** every goal scores dexterity, so the solver is exercised without an attribute formula in the way */
const constructDexterityChecker: GoalPerformanceCheckerConstructor = () => dexterityPerformance;

class BestImprovementFixture {
  private idGenerator = new IdGeneratorSequential({ saveHistory: false });
  private party: AdventuringParty;
  private solver: BestImprovementEquipmentSolver;
  readonly items = new EquipmentSolverTestItems(this.idGenerator);

  constructor() {
    const characterSpecs = [];
    for (let i = 0; i < PARTY_CHARACTER_COUNT; i += 1) {
      characterSpecs.push(
        new AnalysisCharacterSpecification(
          "character 1",
          {
            mainClass: CombatantClass.Warrior,
            supportClass: CombatantClass.Rogue,
            weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
          },
          AnalysisGoal.TotalAccuracy
        )
      );
    }

    const { game, party, analysisSpecContext } = new AnalysisPartyBuilder().build(
      characterSpecs,
      constructDexterityChecker
    );

    this.party = party;

    this.solver = new BestImprovementEquipmentSolver(this.party, analysisSpecContext);
  }

  dropInRoom(equipment: Equipment) {
    this.party.currentRoom.inventory.insertItem(equipment);

    return equipment;
  }

  equipToCharacter(characterIndex: number, equipment: Equipment, slotId: EquipmentSlotId) {
    const character = this.party.combatantManager.getPartyMemberCharacters()[characterIndex];
    invariant(character !== undefined, "expected a character at the passed index");
    character.getEquipmentOption().putEquipmentInSlot(equipment, slotId);

    return equipment;
  }

  solve() {
    return this.solver.solve();
  }

  getEquipmentInFingerSlots() {
    return this.party.combatantManager
      .getPartyMemberCharacters()
      .flatMap((character) =>
        FINGER_SLOT_IDS.map((slotId) => character.getEquipmentOption().getEquipmentInSlot(slotId))
      );
  }

  getEquippedFingerSlotItems() {
    return this.getEquipmentInFingerSlots().filter((equipment) => equipment !== null);
  }
}

describe("best improvement equipment solver", () => {
  it("equips rings in alternate finger slots after filling main finger slots", () => {
    const fixture = new BestImprovementFixture();
    // one ring per finger slot in the party, each an improvement over an empty slot
    const rings = [8, 6, 4, 2].map((dexterity) =>
      fixture.dropInRoom(fixture.items.dexterityRing(dexterity))
    );

    fixture.solve();

    const equipped = new Set(fixture.getEquipmentInFingerSlots());
    for (const ring of rings) {
      expect(equipped.has(ring)).toBe(true);
    }
  });

  it("leaves equipped gear in place when a dropped item improves no one", () => {
    const fixture = new BestImprovementFixture();
    const startingRings = [
      fixture.equipToCharacter(0, fixture.items.dexterityRing(8), EquipmentSlotId.FingerMain),
      fixture.equipToCharacter(0, fixture.items.dexterityRing(7), EquipmentSlotId.FingerAlternate),
      fixture.equipToCharacter(1, fixture.items.dexterityRing(6), EquipmentSlotId.FingerMain),
      fixture.equipToCharacter(1, fixture.items.dexterityRing(5), EquipmentSlotId.FingerAlternate),
    ];
    const unimprovingRing = fixture.dropInRoom(fixture.items.dexterityRing(4));

    const { unusedEquipment } = fixture.solve();

    const equipped = new Set(fixture.getEquippedFingerSlotItems());
    for (const ring of startingRings) {
      expect(equipped.has(ring)).toBe(true);
    }
    expect(unusedEquipment).toHaveLength(1);
    expect(unusedEquipment).toContain(unimprovingRing);
  });

  it("displaces a worn ring for a better one and reports the displaced ring as unused", () => {
    const fixture = new BestImprovementFixture();
    const startingRings = [
      fixture.equipToCharacter(0, fixture.items.dexterityRing(2), EquipmentSlotId.FingerMain),
      fixture.equipToCharacter(0, fixture.items.dexterityRing(2), EquipmentSlotId.FingerAlternate),
      fixture.equipToCharacter(1, fixture.items.dexterityRing(2), EquipmentSlotId.FingerMain),
      fixture.equipToCharacter(1, fixture.items.dexterityRing(2), EquipmentSlotId.FingerAlternate),
    ];
    const upgrade = fixture.dropInRoom(fixture.items.dexterityRing(9));

    const { unusedEquipment } = fixture.solve();

    const equipped = new Set(fixture.getEquippedFingerSlotItems());
    expect(equipped.has(upgrade)).toBe(true);
    expect(equipped.size).toBe(startingRings.length);

    const displacedRings = startingRings.filter((ring) => !equipped.has(ring));
    expect(displacedRings).toHaveLength(1);
    expect(unusedEquipment).toEqual(displacedRings);
  });
});
