import { describe, expect, it } from "vitest";
import { CombatAttribute, EntityName, Equipment, EquipmentType, Ring } from "@speed-dungeon/common";
import { LoadoutFrontier } from "../loadout-frontier";

const ONE_SLOT = 1;
const TWO_RING_SLOTS = 2;

let nextId = 0;

function ring(attributes: Partial<Record<CombatAttribute, number>>, requiredStrength = 0): Equipment {
  nextId += 1;
  const equipment = new Equipment(
    { name: `ring-${nextId}` as EntityName, id: `${nextId}` },
    1,
    requiredStrength === 0 ? {} : { [CombatAttribute.Strength]: requiredStrength },
    { equipmentType: EquipmentType.Ring, baseItemType: Ring.Ring },
    null
  );
  equipment.attributes = attributes;
  return equipment;
}

describe("loadout frontier", () => {
  it("never wears the same ring in both ring slots", () => {
    const onlyRing = ring({ [CombatAttribute.Strength]: 10 });

    const states = new LoadoutFrontier().fillSlots([onlyRing], TWO_RING_SLOTS).getStates();

    const best = Math.max(...states.map((state) => state.contribution.strength));
    expect(best).toBe(10);
    for (const state of states) {
      expect(state.items.length).toBeLessThanOrEqual(1);
    }
  });

  it("wears two different rings when two are available", () => {
    const candidates = [
      ring({ [CombatAttribute.Strength]: 10 }),
      ring({ [CombatAttribute.Strength]: 6 }),
    ];

    const states = new LoadoutFrontier().fillSlots(candidates, TWO_RING_SLOTS).getStates();

    expect(Math.max(...states.map((state) => state.contribution.strength))).toBe(16);
  });

  it("discards a ring beaten on every axis while demanding no less", () => {
    const better = ring({ [CombatAttribute.Strength]: 10, [CombatAttribute.Dexterity]: 5 });
    const dominated = ring({ [CombatAttribute.Strength]: 4, [CombatAttribute.Dexterity]: 2 });

    const states = new LoadoutFrontier().fillSlots([better, dominated], ONE_SLOT).getStates();

    expect(states.some((state) => state.items.includes(dominated))).toBe(false);
    expect(states.some((state) => state.items.includes(better))).toBe(true);
  });

  it("keeps a weaker ring that asks for less, since the allocation may not afford the requirement", () => {
    const strongButDemanding = ring({ [CombatAttribute.Strength]: 10 }, 25);
    const weakButFree = ring({ [CombatAttribute.Strength]: 4 });

    const states = new LoadoutFrontier().fillSlots([strongButDemanding, weakButFree], ONE_SLOT).getStates();

    expect(states.some((state) => state.items.includes(strongButDemanding))).toBe(true);
    expect(states.some((state) => state.items.includes(weakButFree))).toBe(true);
  });

  it("always keeps the empty loadout reachable", () => {
    const states = new LoadoutFrontier()
      .fillSlots([ring({ [CombatAttribute.Strength]: 10 }, 25)], ONE_SLOT)
      .getStates();

    expect(states.some((state) => state.items.length === 0)).toBe(true);
  });
});
