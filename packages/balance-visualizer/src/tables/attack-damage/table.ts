import {
  ArrayUtils,
  EquipmentBaseItem,
  EquipmentSlotId,
  EquipmentType,
  HOLDABLE_SLOT_IDS,
  MapUtils,
} from "@speed-dungeon/common";
import {
  AttackDamageRunSetResult,
  AttackDamageSample,
  DamageRange,
  RoomAvailability,
} from "@/analysis-runs/attack-damage/samples";
import { AttackDamageContributingAttribute } from "@/analysis-runs/analysis-run-reporter";
import { Distribution } from "@/statistics/distribution";
import {
  AnalysisCharacterSpecification,
  CharacterWeaponSpecialty,
} from "@/analysis-subjects/analysis-character-specification";
import {
  baseItemKey,
  EquipmentBaseItemTally,
} from "@/analysis-subjects/equipment-base-item-tally";
import {
  AttackDamageSlice,
  AttackDamageTableRow,
  AverageContributingAttributes,
  HoldableAndPercent,
  roomKey,
} from "./row";

function toPercentages(tally: EquipmentBaseItemTally, total: number): HoldableAndPercent[] {
  return tally
    .entries()
    .map(({ baseItem, count }) => ({ baseItem, percent: count / total }))
    .sort((a, b) => b.percent - a.percent);
}

function averageDamageRange(ranges: DamageRange[]): DamageRange {
  return {
    min: ArrayUtils.average(ranges.map((range) => range.min)),
    max: ArrayUtils.average(ranges.map((range) => range.max)),
  };
}

export class AttackDamageTable {
  private samples: readonly AttackDamageSample[];
  private availabilityByRoom = new Map<string, RoomAvailability[]>();

  constructor(result: AttackDamageRunSetResult) {
    this.samples = result.samples;
    for (const roomAvailability of result.availability) {
      MapUtils.getOrCreate(this.availabilityByRoom, roomKey(roomAvailability), () => []).push(
        roomAvailability
      );
    }
  }

  private matchesSlice(sample: AttackDamageSample, slice: AttackDamageSlice) {
    return (
      (slice.weaponSpecialty === undefined || sample.weaponSpecialty === slice.weaponSpecialty) &&
      (slice.mainClass === undefined || sample.mainClass === slice.mainClass) &&
      (slice.supportClass === undefined || sample.supportClass === slice.supportClass)
    );
  }

  private groupByRoom(samples: AttackDamageSample[]) {
    const byFloor = new Map<number, Map<number, AttackDamageSample[]>>();
    for (const sample of samples) {
      const byRoom = MapUtils.getOrCreate(
        byFloor,
        sample.floor,
        () => new Map<number, AttackDamageSample[]>()
      );
      MapUtils.getOrCreate(byRoom, sample.room, () => []).push(sample);
    }
    return byFloor;
  }

  private averageContribution(
    samples: AttackDamageSample[],
    attribute: AttackDamageContributingAttribute
  ) {
    let fromGear = 0;
    let allocated = 0;
    let inherent = 0;
    for (const sample of samples) {
      const contribution = sample.contributingAttributes[attribute];
      fromGear += contribution.fromGear;
      allocated += contribution.allocated;
      inherent += contribution.inherent;
    }
    return {
      fromGear: fromGear / samples.length,
      allocated: allocated / samples.length,
      inherent: inherent / samples.length,
      total: (fromGear + allocated + inherent) / samples.length,
    };
  }

  private averageContributingAttributes(
    samples: AttackDamageSample[]
  ): AverageContributingAttributes {
    const averageOf = (attribute: AttackDamageContributingAttribute) =>
      this.averageContribution(samples, attribute);

    return {
      [AttackDamageContributingAttribute.Strength]: averageOf(
        AttackDamageContributingAttribute.Strength
      ),
      [AttackDamageContributingAttribute.Dexterity]: averageOf(
        AttackDamageContributingAttribute.Dexterity
      ),
      [AttackDamageContributingAttribute.Accuracy]: averageOf(
        AttackDamageContributingAttribute.Accuracy
      ),
      [AttackDamageContributingAttribute.FlatDamage]: averageOf(
        AttackDamageContributingAttribute.FlatDamage
      ),
    };
  }

  private averageTooltipDamage(samples: AttackDamageSample[]) {
    const offHandRanges = samples
      .map((sample) => sample.tooltipDamage[EquipmentSlotId.OffHand])
      .filter((range) => range !== null);

    return {
      mainHand: averageDamageRange(
        samples.map((sample) => sample.tooltipDamage[EquipmentSlotId.MainHand])
      ),
      offHand: offHandRanges.length === 0 ? null : averageDamageRange(offHandRanges),
    };
  }

  private averageSupportClassLevel(samples: AttackDamageSample[]) {
    const levels = samples
      .map((sample) => sample.supportClassLevel)
      .filter((level) => level !== null);
    return levels.length === 0 ? null : ArrayUtils.average(levels);
  }

  /** counted once per character even when both hands hold the same base item */
  private wornHoldablePercentages(samples: AttackDamageSample[]) {
    const tally = new EquipmentBaseItemTally();

    for (const sample of samples) {
      const heldThisSample = new Map<string, EquipmentBaseItem>();
      for (const slotId of HOLDABLE_SLOT_IDS) {
        const baseItem = sample.wornHoldables[slotId];
        if (baseItem !== null) {
          heldThisSample.set(baseItemKey(baseItem), baseItem);
        }
      }
      for (const baseItem of heldThisSample.values()) {
        tally.add(baseItem);
      }
    }

    return toPercentages(tally, samples.length);
  }

  /**
   * What dropped is a fact about the party, so this counts distinct runs. The room's availability
   * is recorded once per run, and only the runs that contributed a matching character are counted,
   * so widening the slice cannot make an item look more available than it was.
   */
  private availableHoldablePercentages(
    location: { floor: number; room: number },
    samples: AttackDamageSample[]
  ) {
    const usedHoldableTypes = new Set<EquipmentType>();
    const matchedRunIndexes = new Set<number>();

    for (const sample of samples) {
      for (const equipmentType of AnalysisCharacterSpecification.getUsedHoldableTypes(
        sample.weaponSpecialty
      )) {
        usedHoldableTypes.add(equipmentType);
      }
      matchedRunIndexes.add(sample.runIndex);
    }

    const roomAvailability = (this.availabilityByRoom.get(roomKey(location)) ?? []).filter(
      ({ runIndex }) => matchedRunIndexes.has(runIndex)
    );

    const tally = new EquipmentBaseItemTally();
    for (const { availableEquipment } of roomAvailability) {
      for (const { baseItem } of availableEquipment) {
        if (usedHoldableTypes.has(baseItem.equipmentType)) {
          tally.add(baseItem);
        }
      }
    }

    return toPercentages(tally, roomAvailability.length);
  }

  selectRows(slice: AttackDamageSlice): AttackDamageTableRow[] {
    const matching = this.samples.filter((sample) => this.matchesSlice(sample, slice));
    const byFloor = this.groupByRoom(matching);

    const rows: AttackDamageTableRow[] = [];
    for (const [floor, byRoom] of byFloor) {
      for (const [room, roomSamples] of byRoom) {
        rows.push({
          floor,
          room,
          sampleCount: roomSamples.length,
          damageOnDummy: Distribution.of(
            roomSamples.map((sample) => sample.sampledDamageOnDummy)
          ),
          averageMainClassLevel: ArrayUtils.average(
            roomSamples.map((sample) => sample.mainClassLevel)
          ),
          averageSupportClassLevel: this.averageSupportClassLevel(roomSamples),
          averageTooltipDamage: this.averageTooltipDamage(roomSamples),
          averageContributingAttributes: this.averageContributingAttributes(roomSamples),
          wornHoldablePercentages: this.wornHoldablePercentages(roomSamples),
          availableHoldablePercentages: this.availableHoldablePercentages(
            { floor, room },
            roomSamples
          ),
        });
      }
    }

    return rows.sort((a, b) => a.floor - b.floor || a.room - b.room);
  }
}
