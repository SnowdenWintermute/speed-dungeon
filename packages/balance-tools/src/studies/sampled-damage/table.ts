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
import { SampledDamageContributingAttribute } from "./run-reporter.ts";
import { SampledDamageSample } from "./samples.ts";
import { SampledDamageTableRow, AverageContributingAttributes } from "./row.ts";

function averageDamageRange(ranges: SerializedOf<NumberRange>[]) {
  return new NumberRange(
    Math.round(ArrayUtils.average(ranges.map((range) => range.min))),
    Math.round(ArrayUtils.average(ranges.map((range) => range.max)))
  );
}

export class SampledDamageTable extends AnalysisSampleTable<
  SampledDamageSample,
  SampledDamageTableRow
> {
  private averageContribution(
    samples: SampledDamageSample[],
    attribute: SampledDamageContributingAttribute
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
    samples: SampledDamageSample[]
  ): AverageContributingAttributes {
    return numericEnumKeyedRecord(SampledDamageContributingAttribute, (attribute) =>
      this.averageContribution(samples, attribute)
    );
  }

  private averageTooltipDamage(samples: SampledDamageSample[]) {
    const additionalRanges = samples.flatMap((sample) => sample.tooltipDamage.additional);

    return {
      primary: averageDamageRange(samples.map((sample) => sample.tooltipDamage.primary)),
      additional: additionalRanges.length === 0 ? null : averageDamageRange(additionalRanges),
    };
  }

  /**
   * Pooled rather than averaged per character: a character who landed two hits should weigh half as
   * much as one who landed four, which a mean of their two rates would not do.
   */
  private primaryRates(samples: SampledDamageSample[]) {
    let uses = 0;
    let landedHits = 0;
    let criticalHits = 0;
    for (const sample of samples) {
      uses += sample.primaryUseCount;
      landedHits += sample.primaryLandedHitCount;
      criticalHits += sample.primaryCriticalHitCount;
    }
    invariant(landedHits > 0, "expected a room's matched characters to land at least one hit");

    return { hit: landedHits / uses, critical: criticalHits / landedHits };
  }

  /** counted once per character even when both hands hold the same base item */
  private wornHoldablePercentages(samples: SampledDamageSample[]) {
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

  protected selectRow(room: SampledRoom<SampledDamageSample>): SampledDamageTableRow {
    const { samples } = room;
    const primaryRates = this.primaryRates(samples);
    return {
      ...this.commonRowFields(room),
      damageOnDummy: Distribution.of(samples.map((sample) => sample.sampledDamageOnDummy)),
      primaryHitRate: primaryRates.hit,
      primaryCriticalHitRate: primaryRates.critical,
      averageTooltipDamage: this.averageTooltipDamage(samples),
      averageContributingAttributes: this.averageContributingAttributes(samples),
      wornHoldablePercentages: this.wornHoldablePercentages(samples),
    };
  }
}
