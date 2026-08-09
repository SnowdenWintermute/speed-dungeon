import { describe, expect, it } from "vitest";
import {
  ArmorCategory,
  CombatAttribute,
  EntityName,
  Equipment,
  EquipmentBaseItemProperties,
  EquipmentType,
  HeadGear,
  NumberRange,
  OneHandedMeleeWeapon,
  Ring,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { EquipmentAccuracy } from "../accuracy-availability/equipment-accuracy";
import { EquipmentPoolBySlot } from "../equipment-pool-by-slot";

const SOLO = 1;
const PARTY_OF_THREE = 3;

let nextId = 0;

function equipmentWithAccuracy(
  baseItemProperties: EquipmentBaseItemProperties,
  accuracy: number
): Equipment {
  nextId += 1;
  const equipment = new Equipment(
    { name: `test-${nextId}` as EntityName, id: `${nextId}` },
    1,
    {},
    baseItemProperties,
    null
  );
  equipment.attributes = { [CombatAttribute.Accuracy]: accuracy };
  return equipment;
}

const headGear = (accuracy: number) =>
  equipmentWithAccuracy(
    {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Cap,
      armorCategory: ArmorCategory.Cloth,
      armorClass: 0,
    },
    accuracy
  );

const ring = (accuracy: number) =>
  equipmentWithAccuracy(
    { equipmentType: EquipmentType.Ring, baseItemType: Ring.Ring },
    accuracy
  );

const oneHander = (accuracy: number) =>
  equipmentWithAccuracy(
    {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Club,
      damage: new NumberRange(1, 1),
      damageClassification: [],
    },
    accuracy
  );

const twoHander = (accuracy: number) =>
  equipmentWithAccuracy(
    {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.BoStaff,
      damage: new NumberRange(1, 1),
      damageClassification: [],
    },
    accuracy
  );

function poolOf(...equipment: Equipment[]) {
  const pool = new EquipmentPoolBySlot();
  for (const item of equipment) {
    pool.add(item);
  }
  return pool;
}

function wornAccuracy(pool: EquipmentPoolBySlot, characterCount: number) {
  const worn = pool.selectEquipped(characterCount, EquipmentAccuracy.scoreOf);
  const sources = EquipmentAccuracy.sum(worn.map((equipment) => EquipmentAccuracy.of(equipment)));
  return EquipmentAccuracy.total(sources) / characterCount;
}

describe("equipment pool by slot", () => {
  it("wears only the best item in a single-slot type, however many drop", () => {
    const pool = poolOf(headGear(30), headGear(20), headGear(10));

    expect(wornAccuracy(pool, SOLO)).toBe(30);
  });

  it("wears two rings, since a character has two ring slots", () => {
    const pool = poolOf(ring(30), ring(20), ring(10));

    expect(wornAccuracy(pool, SOLO)).toBe(50);
  });

  it("splits a slot's best across the party rather than giving everyone the best item", () => {
    const pool = poolOf(headGear(30), headGear(20), headGear(10));

    // the three characters wear one hat each, so the average is their mean and not 30
    expect(wornAccuracy(pool, PARTY_OF_THREE)).toBe(20);
  });

  it("leaves a slot empty when the party has more characters than items for it", () => {
    const pool = poolOf(headGear(30));

    expect(wornAccuracy(pool, PARTY_OF_THREE)).toBe(10);
  });

  it("takes a two-hander only when it beats the best pair of one-handers", () => {
    const twoHanderWins = poolOf(twoHander(30), oneHander(10), oneHander(10));
    const oneHandersWin = poolOf(twoHander(30), oneHander(20), oneHander(20));

    expect(wornAccuracy(twoHanderWins, SOLO)).toBe(30);
    expect(wornAccuracy(oneHandersWin, SOLO)).toBe(40);
  });

  it("does not put the same one-hander in both hands", () => {
    const pool = poolOf(oneHander(25));

    expect(wornAccuracy(pool, SOLO)).toBe(25);
  });
});
