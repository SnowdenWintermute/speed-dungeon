import {
  ArrayUtils,
  EquipmentBaseItem,
  EquipmentSlotId,
  HOLDABLE_SLOT_IDS,
  NumberRange,
  SerializedOf,
} from "@speed-dungeon/common";
import { SampledRoom } from "@/analysis-runs/analysis-sample";
import { AnalysisSampleTable } from "@/analysis-runs/analysis-sample-table";
import { baseItemKey, EquipmentBaseItemTally } from "@/analysis-subjects/equipment-base-item-tally";
import { Distribution } from "@/statistics/distribution";
import { numericEnumKeyedRecord } from "@/utils/numeric-enum-record";
import { AttackDamageContributingAttribute } from "./run-reporter";
import { AttackDamageSample } from "./samples";
import { AttackDamageTableRow, AverageContributingAttributes } from "./row";

function averageDamageRange(ranges: SerializedOf<NumberRange>[]) {
  return new NumberRange(
    Math.round(ArrayUtils.average(ranges.map((range) => range.min))),
    Math.round(ArrayUtils.average(ranges.map((range) => range.max)))
  );
}

export class AttackDamageTable extends AnalysisSampleTable<
  AttackDamageSample,
  AttackDamageTableRow
> {
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
    return numericEnumKeyedRecord(AttackDamageContributingAttribute, (attribute) =>
      this.averageContribution(samples, attribute)
    );
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

  protected selectRow(room: SampledRoom<AttackDamageSample>): AttackDamageTableRow {
    const { samples } = room;
    return {
      ...this.commonRowFields(room),
      damageOnDummy: Distribution.of(samples.map((sample) => sample.sampledDamageOnDummy)),
      averageTooltipDamage: this.averageTooltipDamage(samples),
      averageContributingAttributes: this.averageContributingAttributes(samples),
      wornHoldablePercentages: this.wornHoldablePercentages(samples),
    };
  }
}
