import { buildEquipmentName, CombatAttribute, Equipment } from "@speed-dungeon/common";
import { Distribution, distributionOf } from "../../utils/distribution";
import {
  DAMAGE_CHANNELS,
  DamageSources,
  EquipmentDamageSources,
} from "../equipment-damage-sources";
import { SpecialtyAllocation } from "./specialty-allocation";
import { Holdables } from "./specialty-holdables";

export interface WeaponDamageRange {
  min: number;
  max: number;
}

// kept per weapon rather than summed: an off-hand swing lands at OFF_HAND_DAMAGE_MODIFIER and
// OFF_HAND_ACCURACY_MODIFIER, so adding the two would read as a two-hander's range
interface HeldWeaponsDamage {
  mainHand: null | WeaponDamageRange;
  /** Averaged only over the runs that held one, so an early room with a single sword does not read
   * as a weak off hand. */
  offHand: null | WeaponDamageRange;
}

export interface WeaponUsage {
  name: string;
  percent: number;
}

/** State of a combatant's choices after the equipment solver ran. Passed across worker boundary. */
export interface ComboSampleData {
  damagePerTurn: number[];
  allocations: SpecialtyAllocation[];
  availability: DamageSources[];
  discretionaryPointsAvailable: number[];
  inherentStrength: number[];
  inherentDexterity: number[];
  weaponDamage: HeldWeaponsDamage[];
  weaponsSelected: Map<string, number>;
  weaponsSelectedTotal: number;
  weaponsAvailable: Map<string, number>;
  drawnCount: number;
  unavailableCount: number;
}

export interface ComboRoomDamage {
  /** Absent until a run drew this combo and found it a weapon. */
  damagePerTurn: null | Distribution;
  meanAllocation: null | SpecialtyAllocation;
  /** What the loot pool offered this character, including their own weapon's stripped affixes. */
  meanAvailability: null | DamageSources;
  /** Of what was available, the share the character actually bought. */
  meanPercentOfAvailabilityAllocated: null | DamageSources;
  meanDiscretionaryPointsAvailable: number;
  meanPercentOfPointsAllocated: number;
  /** Class, level and support class only — no gear, no allocation. */
  meanInherentStrength: number;
  meanInherentDexterity: number;
  meanWeaponDamage: null | HeldWeaponsDamage;
  /** Share of the weapons actually wielded, so a dual wielder's two hands both count. */
  selectedWeapons: WeaponUsage[];
  /** Share of scored runs in which this base item had dropped at all, whether or not it was chosen. */
  availableWeapons: WeaponUsage[];
  drawnCount: number;
  /** Drawn but the specialty's weapon type had not dropped. Excluded from every figure above rather
   * than scored as unarmed. */
  unavailableCount: number;
  percentRunsUnavailable: number;
}

function baseItemNameOf(equipment: Equipment) {
  return buildEquipmentName(equipment.equipmentBaseItemProperties, {});
}

function percentagesOf(counts: Map<string, number>, denominator: number): WeaponUsage[] {
  if (denominator === 0) {
    return [];
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, percent: (count / denominator) * 100 }))
    .sort((a, b) => b.percent - a.percent);
}

function mean(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function addCountsInto(into: Map<string, number>, from: Map<string, number>) {
  for (const [name, count] of from) {
    into.set(name, (into.get(name) ?? 0) + count);
  }
}

export function emptyComboSampleData(): ComboSampleData {
  return {
    damagePerTurn: [],
    allocations: [],
    availability: [],
    discretionaryPointsAvailable: [],
    inherentStrength: [],
    inherentDexterity: [],
    weaponDamage: [],
    weaponsSelected: new Map(),
    weaponsSelectedTotal: 0,
    weaponsAvailable: new Map(),
    drawnCount: 0,
    unavailableCount: 0,
  };
}

/** Accumulates one combo's samples in one room. Lives inside a worker; what leaves is the data. */
export class ComboSamples {
  private readonly data = emptyComboSampleData();

  getData() {
    return this.data;
  }

  recordDrawn() {
    this.data.drawnCount += 1;
  }

  recordUnavailable() {
    this.data.unavailableCount += 1;
  }

  recordScored(sample: {
    damagePerTurn: number;
    allocation: SpecialtyAllocation;
    availability: DamageSources;
    discretionaryPointsAvailable: number;
    inherentStrength: number;
    inherentDexterity: number;
    holdables: Holdables;
    weaponCandidates: Equipment[];
  }) {
    const { data } = this;
    data.damagePerTurn.push(sample.damagePerTurn);
    data.allocations.push(sample.allocation);
    data.availability.push(sample.availability);
    data.discretionaryPointsAvailable.push(sample.discretionaryPointsAvailable);
    data.inherentStrength.push(sample.inherentStrength);
    data.inherentDexterity.push(sample.inherentDexterity);
    data.weaponDamage.push(ComboSampleAnalysis.heldWeaponDamage(sample.holdables));

    for (const equipment of [sample.holdables.mainHand, sample.holdables.offHand]) {
      if (equipment === null || !equipment.isWeapon()) {
        continue;
      }
      const name = baseItemNameOf(equipment);
      data.weaponsSelected.set(name, (data.weaponsSelected.get(name) ?? 0) + 1);
      data.weaponsSelectedTotal += 1;
    }

    // once per distinct base item, so this reads as "was one of these available" rather than
    // rewarding a base item that happened to drop five times
    for (const name of new Set(sample.weaponCandidates.map(baseItemNameOf))) {
      data.weaponsAvailable.set(name, (data.weaponsAvailable.get(name) ?? 0) + 1);
    }
  }
}

/** Everything that reads samples rather than collecting them. Static, because the data it works on
 * arrives from a worker as plain objects with no prototypes to call through. */
export class ComboSampleAnalysis {
  /** Concatenation, not a weighted average of summaries: the percentiles need every sample, and
   * every other figure stays exact for free. */
  static merge(parts: ComboSampleData[]): ComboSampleData {
    const merged = emptyComboSampleData();

    for (const part of parts) {
      merged.damagePerTurn.push(...part.damagePerTurn);
      merged.allocations.push(...part.allocations);
      merged.availability.push(...part.availability);
      merged.discretionaryPointsAvailable.push(...part.discretionaryPointsAvailable);
      merged.inherentStrength.push(...part.inherentStrength);
      merged.inherentDexterity.push(...part.inherentDexterity);
      merged.weaponDamage.push(...part.weaponDamage);
      addCountsInto(merged.weaponsSelected, part.weaponsSelected);
      addCountsInto(merged.weaponsAvailable, part.weaponsAvailable);
      merged.weaponsSelectedTotal += part.weaponsSelectedTotal;
      merged.drawnCount += part.drawnCount;
      merged.unavailableCount += part.unavailableCount;
    }

    return merged;
  }

  static describe(data: ComboSampleData): ComboRoomDamage {
    const scored = data.damagePerTurn.length;

    return {
      damagePerTurn: scored === 0 ? null : distributionOf(data.damagePerTurn),
      meanAllocation: scored === 0 ? null : ComboSampleAnalysis.meanAllocation(data),
      meanAvailability: scored === 0 ? null : ComboSampleAnalysis.meanAvailability(data),
      meanPercentOfAvailabilityAllocated:
        scored === 0 ? null : ComboSampleAnalysis.meanPercentAllocated(data),
      meanDiscretionaryPointsAvailable: mean(data.discretionaryPointsAvailable),
      meanPercentOfPointsAllocated: ComboSampleAnalysis.meanPercentOfPointsAllocated(data),
      meanInherentStrength: mean(data.inherentStrength),
      meanInherentDexterity: mean(data.inherentDexterity),
      meanWeaponDamage: scored === 0 ? null : ComboSampleAnalysis.meanWeaponDamage(data),
      selectedWeapons: percentagesOf(data.weaponsSelected, data.weaponsSelectedTotal),
      availableWeapons: percentagesOf(data.weaponsAvailable, scored),
      drawnCount: data.drawnCount,
      unavailableCount: data.unavailableCount,
      percentRunsUnavailable:
        data.drawnCount === 0 ? 0 : (data.unavailableCount / data.drawnCount) * 100,
    };
  }

  static heldWeaponDamage(holdables: Holdables): HeldWeaponsDamage {
    return {
      mainHand: ComboSampleAnalysis.damageRangeOf(holdables.mainHand),
      offHand: ComboSampleAnalysis.damageRangeOf(holdables.offHand),
    };
  }

  private static meanAvailability(data: ComboSampleData) {
    return EquipmentDamageSources.scale(
      EquipmentDamageSources.sum(data.availability),
      1 / data.availability.length
    );
  }

  private static meanAllocation(data: ComboSampleData): SpecialtyAllocation {
    const fromGear = EquipmentDamageSources.scale(
      EquipmentDamageSources.sum(data.allocations.map((allocation) => allocation.fromGear)),
      1 / data.allocations.length
    );

    const fromDiscretionaryPoints: SpecialtyAllocation["fromDiscretionaryPoints"] = {};
    for (const attribute of [CombatAttribute.Strength, CombatAttribute.Dexterity]) {
      fromDiscretionaryPoints[attribute] = mean(
        data.allocations.map((allocation) => allocation.fromDiscretionaryPoints[attribute] ?? 0)
      );
    }

    return { fromGear, fromDiscretionaryPoints };
  }

  /** Per sample and then averaged, rather than a ratio of the two means: a room where nothing had
   * dropped yet would otherwise contribute a zero denominator to the mean it is averaged into. */
  private static meanPercentAllocated(data: ComboSampleData): DamageSources {
    const percent = { strength: 0, dexterity: 0, accuracy: 0, flatDamage: 0 };

    for (const channel of DAMAGE_CHANNELS) {
      percent[channel] = mean(
        data.allocations.map((allocation, index) => {
          const available = data.availability[index]?.[channel] ?? 0;
          return available === 0 ? 0 : (allocation.fromGear[channel] / available) * 100;
        })
      );
    }

    return percent;
  }

  private static meanPercentOfPointsAllocated(data: ComboSampleData) {
    return mean(
      data.allocations.map((allocation, index) => {
        const available = data.discretionaryPointsAvailable[index] ?? 0;
        if (available === 0) {
          return 0;
        }
        const spent = Object.values(allocation.fromDiscretionaryPoints).reduce(
          (sum, value) => sum + value,
          0
        );
        return (spent / available) * 100;
      })
    );
  }

  private static meanWeaponDamage(data: ComboSampleData): HeldWeaponsDamage {
    const meanOfHand = (hand: keyof HeldWeaponsDamage): null | WeaponDamageRange => {
      const held = data.weaponDamage
        .map((sample) => sample[hand])
        .filter((range) => range !== null);
      if (held.length === 0) {
        return null;
      }
      return { min: mean(held.map(({ min }) => min)), max: mean(held.map(({ max }) => max)) };
    };

    return { mainHand: meanOfHand("mainHand"), offHand: meanOfHand("offHand") };
  }

  // the affixes were baked into the base range before being stripped, so this is the modified range.
  // a shield yields null the same way an empty hand does
  private static damageRangeOf(equipment: null | Equipment): null | WeaponDamageRange {
    if (equipment === null) {
      return null;
    }
    const weaponProperties = equipment.getWeaponProperties();
    if (weaponProperties instanceof Error) {
      return null;
    }
    const { min, max } = weaponProperties.damage;
    return { min, max };
  }
}
