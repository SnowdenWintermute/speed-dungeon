import { ArrayUtils } from "@speed-dungeon/common";
import { AnalysisSlice, RoomGroupedSamples } from "@/analysis-runs/analysis-sample";
import { RoomAvailabilityIndex } from "@/analysis-runs/room-availability";
import { Distribution } from "@/statistics/distribution";
import { AccuracyBySource } from "./run-reporter";
import { MaxAccuracyRunSetResult, MaxAccuracySample } from "./samples";
import { MaxAccuracyTableRow } from "./row";

export class MaxAccuracyTable {
  private rooms: RoomGroupedSamples<MaxAccuracySample>;
  private availability: RoomAvailabilityIndex;

  constructor(result: MaxAccuracyRunSetResult) {
    this.rooms = new RoomGroupedSamples(result.samples);
    this.availability = new RoomAvailabilityIndex(result.availability);
  }

  private averageSupportClassLevel(samples: MaxAccuracySample[]) {
    const levels = samples
      .map((sample) => sample.supportClassLevel)
      .filter((level) => level !== null);
    return levels.length === 0 ? null : ArrayUtils.average(levels);
  }

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

  selectRows(slice: AnalysisSlice): MaxAccuracyTableRow[] {
    return this.rooms.selectRooms(slice).map(({ floor, room, samples }) => ({
      floor,
      room,
      totalAccuracy: Distribution.of(samples.map((sample) => sample.totalAccuracy)),
      accuracyFromEquipment: this.accuracyFromEquipment(samples),
      averageAccuracyBySource: this.averageAccuracyBySource(samples),
      averageMainClassLevel: ArrayUtils.average(samples.map((sample) => sample.mainClassLevel)),
      averageSupportClassLevel: this.averageSupportClassLevel(samples),
      availableHoldablePercentages: this.availability.selectHoldablePercentages(
        { floor, room },
        samples
      ),
    }));
  }
}
