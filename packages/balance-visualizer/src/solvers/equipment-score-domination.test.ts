import {
  Combatant,
  CombatantBuilder,
  CombatantClass,
  Equipment,
  IdGeneratorSequential,
  Username,
} from "@speed-dungeon/common";
import { BestImprovementEquipmentSolver } from "./best-improvement";
import { EquipmentScoreDominationSolver } from "./equipment-score-domination";
import {
  EquipmentSolverTestItems,
  totalDexterity,
  totalStrength,
} from "./equipment-solver-test-items";

const PARTY_CHARACTER_COUNT = 3;

class EquipmentScoreDominationFixture {
  private idGenerator = new IdGeneratorSequential({ saveHistory: false });
  private solver: EquipmentScoreDominationSolver;
  readonly items = new EquipmentSolverTestItems(this.idGenerator);

  constructor(equipmentScoreAxisCheckers: ((equipment: Equipment) => number)[]) {
    const characters: Combatant[] = [];
    for (let i = 0; i < PARTY_CHARACTER_COUNT; i += 1) {
      characters.push(
        CombatantBuilder.playerCharacter(CombatantClass.Warrior, `player-${i}` as Username)
          .name(`character-${i}`)
          .build(this.idGenerator)
      );
    }

    this.solver = new EquipmentScoreDominationSolver(
      BestImprovementEquipmentSolver.getCombatantGroupEquipmentCapacities(characters),
      equipmentScoreAxisCheckers
    );
  }

  getCapacityDominatedEquipment(equipment: Equipment[]) {
    return this.solver.getCapacityDominatedEquipment(
      Equipment.groupBySlotTypeCompatibility(equipment)
    );
  }
}

describe("equipment score domination class", () => {
  it("filters simple case", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity, totalStrength]);
    const ringsFillingCapacity = Array.from({ length: 6 }, () => fixture.items.dexterityRing(2));
    const dominatedRing = fixture.items.dexterityRing(1);

    const unused = fixture.getCapacityDominatedEquipment([...ringsFillingCapacity, dominatedRing]);

    expect(unused.size).toBe(1);
    expect(unused.has(dominatedRing)).toBe(true);
  });

  it("considers items with multiple axes", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity, totalStrength]);
    const dexterityRings = Array.from({ length: 6 }, () => fixture.items.dexterityRing(3));
    const strengthRings = Array.from({ length: 6 }, () => fixture.items.strengthRing(3));
    const hybridRing = fixture.items.dexterityAndStrengthRing(1, 1);

    const unused = fixture.getCapacityDominatedEquipment([
      ...dexterityRings,
      ...strengthRings,
      hybridRing,
    ]);

    expect(unused.size).toBe(0);
  });

  it("considers equipment that are compatible with multiple slot types", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity]);
    const greatAxes = Array.from({ length: 3 }, () => fixture.items.dexterityGreatAxe(2));
    const shortSwords = Array.from({ length: 6 }, () => fixture.items.dexterityShortSword(1));

    const unused = fixture.getCapacityDominatedEquipment([...greatAxes, ...shortSwords]);

    expect(unused.size).toBe(0);
  });

  it("marks dominated items that don't fit within multi-slot capacity", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity]);
    const swordsFillingCapacity = Array.from({ length: 6 }, () => fixture.items.dexterityShortSword(2));
    const dominatedSword = fixture.items.dexterityShortSword(1);

    const unused = fixture.getCapacityDominatedEquipment([
      ...swordsFillingCapacity,
      dominatedSword,
    ]);

    expect(unused.size).toBe(1);
    expect(unused.has(dominatedSword)).toBe(true);
  });

  it("filters items with zero score on all axes", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity]);
    const unscoredSword = fixture.items.plainShortSword();

    const unused = fixture.getCapacityDominatedEquipment([unscoredSword]);

    expect(unused.size).toBe(1);
    expect(unused.has(unscoredSword)).toBe(true);
  });
});
