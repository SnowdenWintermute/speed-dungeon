import {
  ArrayUtils,
  EquipmentBaseItem,
  EquipmentSlotId,
  HOLDABLE_SLOT_IDS,
  NumberRange,
  SerializedOf,
} from "@speed-dungeon/common";
import { AnalysisSlice, RoomGroupedSamples } from "@/analysis-runs/analysis-sample";
import { RoomAvailabilityIndex } from "@/analysis-runs/room-availability";
import { baseItemKey, EquipmentBaseItemTally } from "@/analysis-subjects/equipment-base-item-tally";
import { Distribution } from "@/statistics/distribution";
import { AttackDamageContributingAttribute } from "./run-reporter";
import { AttackDamageRunSetResult, AttackDamageSample } from "./samples";
import { AttackDamageTableRow, AverageContributingAttributes } from "./row";

function averageDamageRange(ranges: SerializedOf<NumberRange>[]) {
  return new NumberRange(
    Math.round(ArrayUtils.average(ranges.map((range) => range.min))),
    Math.round(ArrayUtils.average(ranges.map((range) => range.max)))
  );
}

export class AttackDamageTable {
  private rooms: RoomGroupedSamples<AttackDamageSample>;
  private availability: RoomAvailabilityIndex;

  constructor(result: AttackDamageRunSetResult) {
    this.rooms = new RoomGroupedSamples(result.samples);
    this.availability = new RoomAvailabilityIndex(result.availability);
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

    return tally.toPercentages(samples.length);
  }

  selectRows(slice: AnalysisSlice): AttackDamageTableRow[] {
    return this.rooms.selectRooms(slice).map(({ floor, room, samples }) => ({
      floor,
      room,
      damageOnDummy: Distribution.of(samples.map((sample) => sample.sampledDamageOnDummy)),
      averageMainClassLevel: ArrayUtils.average(samples.map((sample) => sample.mainClassLevel)),
      averageSupportClassLevel: this.averageSupportClassLevel(samples),
      averageTooltipDamage: this.averageTooltipDamage(samples),
      averageContributingAttributes: this.averageContributingAttributes(samples),
      wornHoldablePercentages: this.wornHoldablePercentages(samples),
      availableHoldablePercentages: this.availability.selectHoldablePercentages(
        { floor, room },
        samples
      ),
    }));
  }
}
