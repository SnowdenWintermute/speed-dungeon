import { ArrayUtils } from "@speed-dungeon/common";
import { SampledRoom } from "../../analysis-runs/analysis-sample.ts";
import { AnalysisSampleTable } from "../../analysis-runs/analysis-sample-table.ts";
import { AgilityBySource } from "./run-reporter.ts";
import { MaxSpeedSample } from "./samples.ts";
import { MaxSpeedTableRow } from "./row.ts";

export class MaxSpeedTable extends AnalysisSampleTable<MaxSpeedSample, MaxSpeedTableRow> {
  private averageAgilityBySource(samples: MaxSpeedSample[]): AgilityBySource {
    const averageOf = (readSource: (bySource: AgilityBySource) => number) =>
      ArrayUtils.average(samples.map((sample) => readSource(sample.agilityBySource)));

    return {
      fromGear: averageOf((bySource) => bySource.fromGear),
      allocated: averageOf((bySource) => bySource.allocated),
      inherent: averageOf((bySource) => bySource.inherent),
    };
  }

  protected selectRow(room: SampledRoom<MaxSpeedSample>): MaxSpeedTableRow {
    return {
      ...this.commonRowFields(room),
      averageAgilityBySource: this.averageAgilityBySource(room.samples),
    };
  }
}
