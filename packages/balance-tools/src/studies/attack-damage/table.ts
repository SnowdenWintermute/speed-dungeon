import {
  ArrayUtils,
  EquipmentBaseItem,
  EquipmentSlotId,
  HOLDABLE_SLOT_IDS,
  invariant,
  NumberRange,
  SerializedOf,
} from "@speed-dungeon/common";
import { SampledRoom } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleTable } from "../../analysis-runs/analysis-sample-table.ts";
import { baseItemKey, EquipmentBaseItemTally } from "../../analysis-subjects/equipment-base-item-tally.ts";
import { Distribution } from "../../statistics/distribution.ts";
import { numericEnumKeyedRecord } from "../../utils/numeric-enum-record.ts";
import { AttackDamageContributingAttribute } from "./run-reporter.ts";
import { AttackDamageSample } from "./samples.ts";
import { AttackDamageTableRow, AverageContributingAttributes } from "./row.ts";

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

  /**
   * Pooled rather than averaged per character: a character who landed two hits should weigh half as
   * much as one who landed four, which a mean of their two rates would not do.
   */
  private mainHandRates(samples: AttackDamageSample[]) {
    let swings = 0;
    let landedHits = 0;
    let criticalHits = 0;
    for (const sample of samples) {
      swings += sample.mainHandSwingCount;
      landedHits += sample.mainHandLandedHitCount;
      criticalHits += sample.mainHandCriticalHitCount;
    }
    invariant(landedHits > 0, "expected a room's matched characters to land at least one attack");

    return { hit: landedHits / swings, critical: criticalHits / landedHits };
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
    const mainHandRates = this.mainHandRates(samples);
    return {
      ...this.commonRowFields(room),
      damageOnDummy: Distribution.of(samples.map((sample) => sample.sampledDamageOnDummy)),
      mainHandHitRate: mainHandRates.hit,
      mainHandCriticalHitRate: mainHandRates.critical,
      averageTooltipDamage: this.averageTooltipDamage(samples),
      averageContributingAttributes: this.averageContributingAttributes(samples),
      wornHoldablePercentages: this.wornHoldablePercentages(samples),
    };
  }
}
