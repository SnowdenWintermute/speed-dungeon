import { invariant } from "@speed-dungeon/common";
import { RunAggregator } from "../sim/run-aggregator";
import { RoomVisit } from "../sim/run-history";
import {
  AccuracyPotential,
  AccuracyPotentialRecord,
  CharacterAccuracyPotential,
} from "./character-accuracy-potential";
import { Distribution, distributionOf } from "./distribution";
import { EquipmentAccuracy } from "./equipment-accuracy";

/** Every figure is per character: the accuracy in all loot dropped up to and including this room,
 * divided evenly among the party. It is what the party has *access* to, not what it could wear —
 * slot limits, requirements and the two-handed choice all cut into it. */
export interface RoomAccuracyAvailability {
  ordinal: number;
  floorNumber: number;
  roomNumberOnFloor: number;
  fromAccuracyAffixes: Distribution;
  fromDexterity: Distribution;
  fromAllLoot: Distribution;
  /** Baselines the loot figures are read against, all with no loot equipped and all averaged across
   * the party's characters. See AccuracyPotential for what each assumes. */
  potential: AccuracyPotentialRecord<Distribution>;
}

interface RoomIdentity {
  ordinal: number;
  floorNumber: number;
  roomNumberOnFloor: number;
}

class RoomSamples {
  readonly fromAccuracyAffixes: number[] = [];
  readonly fromDexterity: number[] = [];
  readonly fromAllLoot: number[] = [];
  /** One party average per run, kept whole rather than split per variant so a new variant does not
   * have to be named here as well. */
  readonly potentials: AccuracyPotential[] = [];
}

/** Collects run by run so a caller can discard each walk as it finishes. Retaining every RoomVisit
 * would mean holding a cloned combatant per character per room per run. */
export class AccuracyAvailability implements RunAggregator<RoomAccuracyAvailability[]> {
  private roomIdentities: RoomIdentity[] = [];
  private samplesByRoom: RoomSamples[] = [];

  static ofRuns(runs: RoomVisit[][]) {
    const availability = new AccuracyAvailability();
    for (const visits of runs) {
      availability.collectRun(visits);
    }
    return availability.assemble();
  }

  collectRun(visits: RoomVisit[]) {
    if (this.samplesByRoom.length === 0) {
      this.roomIdentities = visits.map(({ ordinal, floorNumber, roomNumberOnFloor }) => ({
        ordinal,
        floorNumber,
        roomNumberOnFloor,
      }));
      this.samplesByRoom = visits.map(() => new RoomSamples());
    }

    invariant(
      visits.length === this.samplesByRoom.length,
      "runs visited different room counts, so they do not line up room by room"
    );

    let fromAccuracyAffixes = 0;
    let fromDexterity = 0;

    visits.forEach((visit, index) => {
      for (const equipment of visit.equipmentDropped) {
        const sources = EquipmentAccuracy.of(equipment);
        fromAccuracyAffixes += sources.fromAccuracyAffixes;
        fromDexterity += sources.fromDexterity;
      }

      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a visited room has no sample collector");

      const characterCount = visit.characters.length;
      samples.fromAccuracyAffixes.push(fromAccuracyAffixes / characterCount);
      samples.fromDexterity.push(fromDexterity / characterCount);
      samples.fromAllLoot.push((fromAccuracyAffixes + fromDexterity) / characterCount);

      samples.potentials.push(
        CharacterAccuracyPotential.mean(
          visit.characters.map(({ combatant }) => CharacterAccuracyPotential.of(combatant))
        )
      );
    });
  }

  assemble(): RoomAccuracyAvailability[] {
    return this.roomIdentities.map((identity, index) => {
      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a room has no samples despite every run visiting it");

      return {
        ...identity,
        fromAccuracyAffixes: distributionOf(samples.fromAccuracyAffixes),
        fromDexterity: distributionOf(samples.fromDexterity),
        fromAllLoot: distributionOf(samples.fromAllLoot),
        potential: AccuracyAvailability.potentialDistributions(samples.potentials),
      };
    });
  }

  private static potentialDistributions(
    potentials: AccuracyPotential[]
  ): AccuracyPotentialRecord<Distribution> {
    const distributionOfVariant = (variant: keyof AccuracyPotential) =>
      distributionOf(potentials.map((potential) => potential[variant]));

    return {
      asPlayed: distributionOfVariant("asPlayed"),
      withSupportClass: distributionOfVariant("withSupportClass"),
      withMaxDexterity: distributionOfVariant("withMaxDexterity"),
      withMaxDexterityAndSupportClass: distributionOfVariant("withMaxDexterityAndSupportClass"),
      fromAllocatedPoints: distributionOfVariant("fromAllocatedPoints"),
      fromAllocatedPointsWithSupportClass: distributionOfVariant(
        "fromAllocatedPointsWithSupportClass"
      ),
    };
  }
}
