import {
  Affix,
  AffixGenerator,
  AffixType,
  Combatant,
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  Equipment,
  EquipmentRandomizer,
  IdGeneratorSequential,
  ItemBuilder,
  OneHandedMeleeWeapon,
  RandomNumberGenerationPolicyFactory,
  TwoHandedMeleeWeapon,
  Username,
} from "@speed-dungeon/common";
import { BestImprovementEquipmentSolver } from "./best-improvement";
import { EquipmentScoreDominationSolver } from "./equipment-score-domination";

const PARTY_CHARACTER_COUNT = 3;

const totalDexterity = (equipment: Equipment) =>
  equipment.getAffixAttributeValue(AffixType.Dexterity, CombatAttribute.Dexterity);

const totalStrength = (equipment: Equipment) =>
  equipment.getAffixAttributeValue(AffixType.Strength, CombatAttribute.Strength);

class EquipmentScoreDominationFixture {
  private idGenerator = new IdGeneratorSequential({ saveHistory: false });
  private itemBuilder: ItemBuilder;
  private solver: EquipmentScoreDominationSolver;

  constructor(equipmentScoreAxisCheckers: ((equipment: Equipment) => number)[]) {
    const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(0);
    this.itemBuilder = new ItemBuilder(
      new EquipmentRandomizer(rngPolicy, new AffixGenerator(rngPolicy))
    );

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

  private attributeAffix(attribute: CombatAttribute, value: number): Affix {
    return { combatAttributes: { [attribute]: value }, equipmentTraits: {}, tier: 1 };
  }

  dexterityRing(dexterity: number) {
    return this.itemBuilder
      .ring()
      .suffix(AffixType.Dexterity, this.attributeAffix(CombatAttribute.Dexterity, dexterity))
      .build(this.idGenerator);
  }

  strengthRing(strength: number) {
    return this.itemBuilder
      .ring()
      .suffix(AffixType.Strength, this.attributeAffix(CombatAttribute.Strength, strength))
      .build(this.idGenerator);
  }

  dexterityAndStrengthRing(dexterity: number, strength: number) {
    return this.itemBuilder
      .ring()
      .suffix(AffixType.Dexterity, this.attributeAffix(CombatAttribute.Dexterity, dexterity))
      .suffix(AffixType.Strength, this.attributeAffix(CombatAttribute.Strength, strength))
      .build(this.idGenerator);
  }

  dexterityShortSword(dexterity: number) {
    return this.itemBuilder
      .oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSword)
      .suffix(AffixType.Dexterity, this.attributeAffix(CombatAttribute.Dexterity, dexterity))
      .build(this.idGenerator);
  }

  plainShortSword() {
    return this.itemBuilder
      .oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSword)
      .build(this.idGenerator);
  }

  dexterityGreatAxe(dexterity: number) {
    return this.itemBuilder
      .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.GreatAxe)
      .suffix(AffixType.Dexterity, this.attributeAffix(CombatAttribute.Dexterity, dexterity))
      .build(this.idGenerator);
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
    const ringsFillingCapacity = Array.from({ length: 6 }, () => fixture.dexterityRing(2));
    const dominatedRing = fixture.dexterityRing(1);

    const unused = fixture.getCapacityDominatedEquipment([...ringsFillingCapacity, dominatedRing]);

    expect(unused.size).toBe(1);
    expect(unused.has(dominatedRing)).toBe(true);
  });

  it("considers items with multiple axes", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity, totalStrength]);
    const dexterityRings = Array.from({ length: 6 }, () => fixture.dexterityRing(3));
    const strengthRings = Array.from({ length: 6 }, () => fixture.strengthRing(3));
    const hybridRing = fixture.dexterityAndStrengthRing(1, 1);

    const unused = fixture.getCapacityDominatedEquipment([
      ...dexterityRings,
      ...strengthRings,
      hybridRing,
    ]);

    expect(unused.size).toBe(0);
  });

  it("considers equipment that are compatible with multiple slot types", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity]);
    const greatAxes = Array.from({ length: 3 }, () => fixture.dexterityGreatAxe(2));
    const shortSwords = Array.from({ length: 6 }, () => fixture.dexterityShortSword(1));

    const unused = fixture.getCapacityDominatedEquipment([...greatAxes, ...shortSwords]);

    expect(unused.size).toBe(0);
  });

  it("marks dominated items that don't fit within multi-slot capacity", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity]);
    const swordsFillingCapacity = Array.from({ length: 6 }, () => fixture.dexterityShortSword(2));
    const dominatedSword = fixture.dexterityShortSword(1);

    const unused = fixture.getCapacityDominatedEquipment([
      ...swordsFillingCapacity,
      dominatedSword,
    ]);

    expect(unused.size).toBe(1);
    expect(unused.has(dominatedSword)).toBe(true);
  });

  it("filters items with zero score on all axes", () => {
    const fixture = new EquipmentScoreDominationFixture([totalDexterity]);
    const unscoredSword = fixture.plainShortSword();

    const unused = fixture.getCapacityDominatedEquipment([unscoredSword]);

    expect(unused.size).toBe(1);
    expect(unused.has(unscoredSword)).toBe(true);
  });
});
