import { CombatAttribute, CombatantClass, MapUtils } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import { AnalysisSlice } from "./analysis-slice.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";

export interface AnalysisSampleDimensions {
  runIndex: number;
  floor: number;
  room: number;
  weaponSpecialty: CharacterWeaponSpecialty;
  mainClass: CombatantClass;
  supportClass: CombatantClass | null;
  mainClassLevel: number;
  supportClassLevel: number | null;
  /** what this character was solving for, so a mixed run's table can be read one goal at a time */
  goal: AnalysisGoal;
  /** every study carries these, so a reader of any table can ask what a build was worth in a room */
  totalAttributes: Record<CombatAttribute, number>;
}

export function roomKey(location: { floor: number; room: number }) {
  return `${location.floor}-${location.room}`;
}

export interface SampledRoom<TSample> {
  floor: number;
  room: number;
  samples: TSample[];
}

/** the walk from a study's flat samples to one entry per room, which every study's table starts with */
export class RoomGroupedSamples<TSample extends AnalysisSampleDimensions> {
  constructor(private samples: readonly TSample[]) {}

  private matchesSlice(sample: TSample, slice: AnalysisSlice) {
    return (
      (slice.weaponSpecialty === undefined || sample.weaponSpecialty === slice.weaponSpecialty) &&
      (slice.mainClass === undefined || sample.mainClass === slice.mainClass) &&
      (slice.supportClass === undefined || sample.supportClass === slice.supportClass) &&
      (slice.goal === undefined || sample.goal === slice.goal)
    );
  }

  selectRooms(slice: AnalysisSlice): SampledRoom<TSample>[] {
    const byRoom = new Map<string, SampledRoom<TSample>>();

    for (const sample of this.samples) {
      if (!this.matchesSlice(sample, slice)) {
        continue;
      }
      const { floor, room } = sample;
      MapUtils.getOrCreate(byRoom, roomKey(sample), () => ({
        floor,
        room,
        samples: [],
      })).samples.push(sample);
    }

    return [...byRoom.values()].sort((a, b) => a.floor - b.floor || a.room - b.room);
  }
}
