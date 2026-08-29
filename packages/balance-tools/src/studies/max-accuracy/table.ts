import { ArrayUtils } from "@speed-dungeon/common";
import { SampledRoom } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleTable } from "../../analysis-runs/analysis-sample-table.ts";
import { Distribution } from "../../statistics/distribution.ts";
import { AccuracyBySource } from "./run-reporter.ts";
import { MaxAccuracySample } from "./samples.ts";
import { MaxAccuracyTableRow } from "./row.ts";

export class MaxAccuracyTable extends AnalysisSampleTable<MaxAccuracySample, MaxAccuracyTableRow> {
  private averageAccuracyBySource(samples: MaxAccuracySample[]): AccuracyBySource {
    const averageOf = (readSource: (bySource: AccuracyBySource) => number) =>
      ArrayUtils.average(samples.map((sample) => readSource(sample.accuracyBySource)));

    return {
      fromAccuracyAffixOnGear: averageOf((bySource) => bySource.fromAccuracyAffixOnGear),
      fromDexterityAffixOnGear: averageOf((bySource) => bySource.fromDexterityAffixOnGear),
      fromAllocated: averageOf((bySource) => bySource.fromAllocated),
      fromInherent: averageOf((bySource) => bySource.fromInherent),
    };
  }

  private accuracyFromEquipment(samples: MaxAccuracySample[]) {
    return Distribution.of(
      samples.map(
        ({ accuracyBySource }) =>
          accuracyBySource.fromAccuracyAffixOnGear + accuracyBySource.fromDexterityAffixOnGear
      )
    );
  }

  protected selectRow(room: SampledRoom<MaxAccuracySample>): MaxAccuracyTableRow {
    const { samples } = room;
    return {
      ...this.commonRowFields(room),
      totalAccuracy: Distribution.of(samples.map((sample) => sample.totalAccuracy)),
      accuracyFromEquipment: this.accuracyFromEquipment(samples),
      averageAccuracyBySource: this.averageAccuracyBySource(samples),
    };
  }
}
