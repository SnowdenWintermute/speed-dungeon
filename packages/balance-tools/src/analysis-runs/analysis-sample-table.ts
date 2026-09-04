import { ArrayUtils, CombatAttribute, EquipmentBaseItem, MapUtils } from "@speed-dungeon/common";
import { BaseItemAndPercent } from "../analysis-subjects/equipment-base-item-tally.ts";
import { Distribution } from "../statistics/distribution.ts";
import { numericEnumKeyedRecord } from "../utils/numeric-enum-record.ts";
import { AnalysisSampleDimensions, RoomGroupedSamples, SampledRoom } from "./analysis-sample.ts";
import { AnalysisSlice, sliceKey } from "./analysis-slice.ts";
import { RoomAvailabilityIndex } from "./room-availability.ts";
import { AnalysisSampleRunSetResult } from "./run-set.ts";

/** What every study's table reports about a room, whatever else its own row adds. */
export interface AnalysisTableRow {
  floor: number;
  room: number;
  averageMainClassLevel: number;
  /** null when no matched character had a support class */
  averageSupportClassLevel: number | null;
  /** percent of runs in which it had dropped by this room, limited to types the build uses */
  availableHoldablePercentages: BaseItemAndPercent[];
  /** what the matched characters were actually worth here, which is what gates equipment */
  totalAttributes: Record<CombatAttribute, Distribution>;
}

export interface StudyTable<TRow extends AnalysisTableRow> {
  selectRows(slice: AnalysisSlice): TRow[];
}

export abstract class AnalysisSampleTable<
  TSample extends AnalysisSampleDimensions,
  TRow extends AnalysisTableRow,
> {
  private rooms: RoomGroupedSamples<TSample>;
  /** a study's own row can ask it for more than the common fields do, such as armor availability */
  protected availability: RoomAvailabilityIndex;
  /**
   * A table is built from one finished result and never changes after, so a slice always selects the
   * same rows. Worth holding on to: a slice costs a full walk of every sample plus a distribution per
   * attribute per room, and the requirement generator asks for one slice per target — 35 targets
   * sharing 3 slices, measured at 2.8 of the 3.0 seconds a generation took.
   */
  private rowsBySlice = new Map<string, TRow[]>();

  constructor(result: AnalysisSampleRunSetResult<TSample>) {
    this.rooms = new RoomGroupedSamples(result.samples);
    this.availability = new RoomAvailabilityIndex(result.availability);
  }

  protected abstract selectRow(room: SampledRoom<TSample>): TRow;

  /** what an item's drop rate looked like room by room, which decides where to read a build from */
  selectAvailabilityCurve(baseItem: EquipmentBaseItem) {
    return this.availability.selectAvailabilityCurve(baseItem);
  }

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
      totalAttributes: numericEnumKeyedRecord(CombatAttribute, (attribute) =>
        Distribution.of(samples.map((sample) => sample.totalAttributes[attribute]))
      ),
    };
  }

  /** the rows are shared with every caller asking for the same slice, so nobody may mutate them */
  selectRows(slice: AnalysisSlice): TRow[] {
    return MapUtils.getOrCreate(this.rowsBySlice, sliceKey(slice), () =>
      this.rooms.selectRooms(slice).map((room) => this.selectRow(room))
    );
  }
}
