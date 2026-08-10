import { buildEquipmentName, CombatAttribute, Equipment } from "@speed-dungeon/common";
import { Distribution, distributionOf } from "../../utils/distribution";
import { DAMAGE_CHANNELS, DamageSources, EquipmentDamageSources } from "../equipment-damage-sources";
import { SpecialtyAllocation } from "./specialty-allocation";
import { Holdables } from "./specialty-holdables";

export interface WeaponDamageRange {
  min: number;
  max: number;
}

// kept per weapon rather than summed: an off-hand swing lands at OFF_HAND_DAMAGE_MODIFIER and
// OFF_HAND_ACCURACY_MODIFIER, so adding the two would read as a two-hander's range
export interface HeldWeaponDamage {
  mainHand: null | WeaponDamageRange;
  /** Averaged only over the runs that held one, so an early room with a single sword does not read
   * as a weak off hand. */
  offHand: null | WeaponDamageRange;
}

export interface WeaponUsage {
  name: string;
  percent: number;
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
  meanWeaponDamage: null | HeldWeaponDamage;
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

/** One combo's samples in one room, across every run that drew it. */
export class ComboSamples {
  private readonly damagePerTurn: number[] = [];
  private readonly allocations: SpecialtyAllocation[] = [];
  private readonly availability: DamageSources[] = [];
  private readonly discretionaryPointsAvailable: number[] = [];
  private readonly inherentStrength: number[] = [];
  private readonly inherentDexterity: number[] = [];
  private readonly weaponDamage: HeldWeaponDamage[] = [];
  private readonly weaponsSelected = new Map<string, number>();
  private weaponsSelectedTotal = 0;
  private readonly weaponsAvailable = new Map<string, number>();
  private drawnCount = 0;
  private unavailableCount = 0;

  recordDrawn() {
    this.drawnCount += 1;
  }

  recordUnavailable() {
    this.unavailableCount += 1;
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
    this.damagePerTurn.push(sample.damagePerTurn);
    this.allocations.push(sample.allocation);
    this.availability.push(sample.availability);
    this.discretionaryPointsAvailable.push(sample.discretionaryPointsAvailable);
    this.inherentStrength.push(sample.inherentStrength);
    this.inherentDexterity.push(sample.inherentDexterity);
    this.weaponDamage.push(ComboSamples.heldWeaponDamage(sample.holdables));

    for (const equipment of [sample.holdables.mainHand, sample.holdables.offHand]) {
      if (equipment === null || !equipment.isWeapon()) {
        continue;
      }
      const name = baseItemNameOf(equipment);
      this.weaponsSelected.set(name, (this.weaponsSelected.get(name) ?? 0) + 1);
      this.weaponsSelectedTotal += 1;
    }

    // once per distinct base item, so this reads as "was one of these available" rather than
    // rewarding a base item that happened to drop five times
    for (const name of new Set(sample.weaponCandidates.map(baseItemNameOf))) {
      this.weaponsAvailable.set(name, (this.weaponsAvailable.get(name) ?? 0) + 1);
    }
  }

  describe(): ComboRoomDamage {
    const scored = this.damagePerTurn.length;

    return {
      damagePerTurn: scored === 0 ? null : distributionOf(this.damagePerTurn),
      meanAllocation: scored === 0 ? null : this.meanAllocation(),
      meanAvailability: scored === 0 ? null : this.meanAvailability(),
      meanPercentOfAvailabilityAllocated: scored === 0 ? null : this.meanPercentAllocated(),
      meanDiscretionaryPointsAvailable: mean(this.discretionaryPointsAvailable),
      meanPercentOfPointsAllocated: this.meanPercentOfPointsAllocated(),
      meanInherentStrength: mean(this.inherentStrength),
      meanInherentDexterity: mean(this.inherentDexterity),
      meanWeaponDamage: scored === 0 ? null : this.meanWeaponDamage(),
      selectedWeapons: percentagesOf(this.weaponsSelected, this.weaponsSelectedTotal),
      availableWeapons: percentagesOf(this.weaponsAvailable, scored),
      drawnCount: this.drawnCount,
      unavailableCount: this.unavailableCount,
      percentRunsUnavailable:
        this.drawnCount === 0 ? 0 : (this.unavailableCount / this.drawnCount) * 100,
    };
  }

  private meanAvailability() {
    return EquipmentDamageSources.scale(
      EquipmentDamageSources.sum(this.availability),
      1 / this.availability.length
    );
  }

  private meanAllocation(): SpecialtyAllocation {
    const fromGear = EquipmentDamageSources.scale(
      EquipmentDamageSources.sum(this.allocations.map((allocation) => allocation.fromGear)),
      1 / this.allocations.length
    );

    const fromDiscretionaryPoints: SpecialtyAllocation["fromDiscretionaryPoints"] = {};
    for (const attribute of [CombatAttribute.Strength, CombatAttribute.Dexterity]) {
      fromDiscretionaryPoints[attribute] = mean(
        this.allocations.map((allocation) => allocation.fromDiscretionaryPoints[attribute] ?? 0)
      );
    }

    return { fromGear, fromDiscretionaryPoints };
  }

  /** Per sample and then averaged, rather than a ratio of the two means: a room where nothing had
   * dropped yet would otherwise contribute a zero denominator to the mean it is averaged into. */
  private meanPercentAllocated(): DamageSources {
    const percent = { strength: 0, dexterity: 0, accuracy: 0, flatDamage: 0 };

    for (const channel of DAMAGE_CHANNELS) {
      percent[channel] = mean(
        this.allocations.map((allocation, index) => {
          const available = this.availability[index]?.[channel] ?? 0;
          return available === 0 ? 0 : (allocation.fromGear[channel] / available) * 100;
        })
      );
    }

    return percent;
  }

  private meanPercentOfPointsAllocated() {
    return mean(
      this.allocations.map((allocation, index) => {
        const available = this.discretionaryPointsAvailable[index] ?? 0;
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

  private meanWeaponDamage(): HeldWeaponDamage {
    const meanOfHand = (hand: keyof HeldWeaponDamage): null | WeaponDamageRange => {
      const held = this.weaponDamage.map((sample) => sample[hand]).filter((range) => range !== null);
      if (held.length === 0) {
        return null;
      }
      return { min: mean(held.map(({ min }) => min)), max: mean(held.map(({ max }) => max)) };
    };

    return { mainHand: meanOfHand("mainHand"), offHand: meanOfHand("offHand") };
  }

  private static heldWeaponDamage(holdables: Holdables): HeldWeaponDamage {
    return {
      mainHand: ComboSamples.damageRangeOf(holdables.mainHand),
      offHand: ComboSamples.damageRangeOf(holdables.offHand),
    };
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
