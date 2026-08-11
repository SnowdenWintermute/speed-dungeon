import { describe, expect, it } from "vitest";
import { CombatantClass, DEEPEST_FLOOR } from "@speed-dungeon/common";
import { DungeonRun } from "../dungeon-run";
import { RoomVisit } from "../run-history";
import { withoutSupportClass } from "../character-spec";

const PARTY_CLASSES = [CombatantClass.Warrior, CombatantClass.Rogue, CombatantClass.Mage];

function walkFullDungeon(): RoomVisit[] {
  return DungeonRun.random(withoutSupportClass(PARTY_CLASSES), DEEPEST_FLOOR).walk();
}

function ascendingFrom(start: number, length: number) {
  return Array.from({ length }, (_, index) => index + start);
}

describe("a party clearing every room of the dungeon", () => {
  it("visits every floor in order, numbering rooms from one on each floor", () => {
    const visits = walkFullDungeon();

    const floorsVisited = [...new Set(visits.map((visit) => visit.floor))];
    expect(floorsVisited).toEqual(ascendingFrom(1, DEEPEST_FLOOR));

    for (const floorNumber of floorsVisited) {
      const roomNumbers = visits
        .filter((visit) => visit.floor === floorNumber)
        .map((visit) => visit.roomNumberOnFloor);
      expect(roomNumbers).toEqual(ascendingFrom(1, roomNumbers.length));
    }

    expect(visits.map((visit) => visit.ordinal)).toEqual(ascendingFrom(1, visits.length));
  });

  // resolving a fabricated victory with no combat is not something the real game ever does, so this
  // covers the assembly rather than the game code it drives
  it("earns experience and drops equipment through the synthetic victory path", () => {
    const visits = walkFullDungeon();

    const finalVisit = visits.at(-1);
    expect(finalVisit).toBeDefined();
    for (const { combatant, experienceEarned } of finalVisit?.characters ?? []) {
      expect(experienceEarned).toBeGreaterThan(0);
      const { level } = combatant.combatantProperties.classProgressionProperties.getMainClass();
      expect(level).toBeGreaterThan(1);
    }

    expect(visits.flatMap((visit) => visit.equipmentDropped).length).toBeGreaterThan(0);
  });
});
