import { CombatantClass, MapUtils } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "@/analysis-subjects/analysis-character-specification";

/**
 * What every study records about the character a sample came from and where it was taken. The
 * dimensions travel with the row so a table can slice on any subset of them without the collection
 * stage having chosen a key.
 */
export interface AnalysisSampleDimensions {
  runIndex: number;
  floor: number;
  room: number;
  weaponSpecialty: CharacterWeaponSpecialty;
  mainClass: CombatantClass;
  supportClass: CombatantClass | null;
  mainClassLevel: number;
  supportClassLevel: number | null;
}

/** an omitted dimension means "any", so dropping one widens the slice without a re-run */
export interface AnalysisSlice {
  weaponSpecialty?: CharacterWeaponSpecialty;
  mainClass?: CombatantClass;
  supportClass?: CombatantClass | null;
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
      (slice.supportClass === undefined || sample.supportClass === slice.supportClass)
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
