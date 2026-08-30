import { ArrayUtils } from "@speed-dungeon/common";
import { SampledRoom } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleTable } from "../../analysis-runs/analysis-sample-table.ts";
import { EquipmentBaseItemTally } from "../../analysis-subjects/equipment-base-item-tally.ts";
import { Distribution } from "../../statistics/distribution.ts";
import { ARMOR_CLASS_SLOT_IDS, armorClassSlotRecord } from "./run-reporter.ts";
import { ArmorClassSample } from "./samples.ts";
import { ArmorClassTableRow } from "./row.ts";

export class ArmorClassTable extends AnalysisSampleTable<ArmorClassSample, ArmorClassTableRow> {
  private averageArmorClassBySlot(samples: ArmorClassSample[]) {
    return armorClassSlotRecord((slotId) =>
      ArrayUtils.average(samples.map((sample) => sample.armorClassBySlot[slotId]))
    );
  }

  /**
   * Every worn piece counted, with no dedupe: the three slots take three different equipment types,
   * so unlike two hands holding the same weapon they can never be the same base item twice.
   */
  private wornArmorPercentages(samples: ArmorClassSample[]) {
    const tally = new EquipmentBaseItemTally();

    for (const sample of samples) {
      for (const slotId of ARMOR_CLASS_SLOT_IDS) {
        const baseItem = sample.wornArmor[slotId];
        if (baseItem !== null) {
          tally.add(baseItem);
        }
      }
    }

    return tally.toPercentages(samples.length);
  }

  protected selectRow(room: SampledRoom<ArmorClassSample>): ArmorClassTableRow {
    const { floor, samples } = room;

    return {
      ...this.commonRowFields(room),
      totalArmorClass: Distribution.of(samples.map((sample) => sample.totalArmorClass)),
      averageArmorClassBySlot: this.averageArmorClassBySlot(samples),
      wornArmorPercentages: this.wornArmorPercentages(samples),
      availableArmorPercentages: this.availability.selectArmorPercentages(
        { floor, room: room.room },
        samples
      ),
    };
  }
}
