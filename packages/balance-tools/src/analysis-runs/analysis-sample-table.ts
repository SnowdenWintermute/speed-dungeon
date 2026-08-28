import { ArrayUtils, CombatAttribute, EquipmentBaseItem } from "@speed-dungeon/common";
import { HoldableAndPercent } from "@/analysis-subjects/equipment-base-item-tally";
import { Distribution } from "@/statistics/distribution";
import { numericEnumKeyedRecord } from "@/utils/numeric-enum-record";
import { AnalysisSampleDimensions, RoomGroupedSamples, SampledRoom } from "./analysis-sample";
import { AnalysisSlice } from "./analysis-slice";
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
  /** what the matched characters were actually worth here, which is what gates equipment */
  totalAttributes: Record<CombatAttribute, Distribution>;
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

  selectRows(slice: AnalysisSlice): TRow[] {
    return this.rooms.selectRooms(slice).map((room) => this.selectRow(room));
  }
}
