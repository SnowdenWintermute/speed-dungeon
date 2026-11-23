import { ArrayUtils } from "@speed-dungeon/common";
import { SampledRoom } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleTable } from "../../analysis-runs/analysis-sample-table.ts";
import { AgilityBySource } from "./run-reporter.ts";
import { MaxAgilitySample } from "./samples.ts";
import { MaxAgilityTableRow } from "./row.ts";

export class MaxAgilityTable extends AnalysisSampleTable<MaxAgilitySample, MaxAgilityTableRow> {
  private averageAgilityBySource(samples: MaxAgilitySample[]): AgilityBySource {
    const averageOf = (readSource: (bySource: AgilityBySource) => number) =>
      ArrayUtils.average(samples.map((sample) => readSource(sample.agilityBySource)));

    return {
      fromGear: averageOf((bySource) => bySource.fromGear),
      allocated: averageOf((bySource) => bySource.allocated),
      inherent: averageOf((bySource) => bySource.inherent),
    };
  }

  protected selectRow(room: SampledRoom<MaxAgilitySample>): MaxAgilityTableRow {
    return {
      ...this.commonRowFields(room),
      averageAgilityBySource: this.averageAgilityBySource(room.samples),
    };
  }
}
