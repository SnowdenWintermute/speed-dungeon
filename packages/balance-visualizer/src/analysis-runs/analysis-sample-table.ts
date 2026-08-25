import { ArrayUtils } from "@speed-dungeon/common";
import { HoldableAndPercent } from "@/analysis-subjects/equipment-base-item-tally";
import {
  AnalysisSampleDimensions,
  AnalysisSlice,
  RoomGroupedSamples,
  SampledRoom,
} from "./analysis-sample";
import { RoomAvailabilityIndex } from "./room-availability";
import { AnalysisSampleRunSetResult } from "./run-set";

/** What every study's table reports about a room, whatever else its own row adds. */
export interface AnalysisTableRow {
  floor: number;
  room: number;
  averageMainClassLevel: number;
  /** null when no matched character had a support class */
  averageSupportClassLevel: number | null;
  /** percent of runs in which it had dropped by this room, limited to types the build uses */
  availableHoldablePercentages: HoldableAndPercent[];
}

export abstract class AnalysisSampleTable<
  TSample extends AnalysisSampleDimensions,
  TRow extends AnalysisTableRow,
> {
  private rooms: RoomGroupedSamples<TSample>;
  private availability: RoomAvailabilityIndex;

  constructor(result: AnalysisSampleRunSetResult<TSample>) {
    this.rooms = new RoomGroupedSamples(result.samples);
    this.availability = new RoomAvailabilityIndex(result.availability);
  }

  protected abstract selectRow(room: SampledRoom<TSample>): TRow;

  protected commonRowFields({ floor, room, samples }: SampledRoom<TSample>): AnalysisTableRow {
    const supportClassLevels = samples
      .map((sample) => sample.supportClassLevel)
      .filter((level) => level !== null);

    return {
      floor,
      room,
      averageMainClassLevel: ArrayUtils.average(samples.map((sample) => sample.mainClassLevel)),
      averageSupportClassLevel:
        supportClassLevels.length === 0 ? null : ArrayUtils.average(supportClassLevels),
      availableHoldablePercentages: this.availability.selectHoldablePercentages(
        { floor, room },
        samples
      ),
    };
  }

  selectRows(slice: AnalysisSlice): TRow[] {
    return this.rooms.selectRooms(slice).map((room) => this.selectRow(room));
  }
}
