import { invariant } from "@speed-dungeon/common";
import { RunAggregator } from "../../sim/run-aggregator";
import { RoomVisit } from "../../sim/run-history";
import { SIMULATED_PARTY_CLASSES } from "../../sim/dungeon-run";
import {
  AccuracyPotential,
  AccuracyPotentialRecord,
  CharacterAccuracyPotential,
} from "./character-accuracy-potential";
import { EquipmentAccuracy } from "./equipment-accuracy";
import { EquipmentPoolBySlot } from "../equipment-pool-by-slot";
import { Distribution, distributionOf } from "../../utils/distribution";

/** Every figure is per character: the accuracy a character would be *wearing* out of all loot
 * dropped up to and including this room, once one slot can only hold one item and the party of
 * three competes for the same pool. Requirements are still not modelled, so an item counts even if
 * nobody could meet its attribute gates. */
export interface RoomAccuracyAvailability {
  ordinal: number;
  floorNumber: number;
  roomNumberOnFloor: number;
  fromAccuracyAffixes: Distribution;
  fromDexterity: Distribution;
  fromEquipped: Distribution;
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
  readonly fromEquipped: number[] = [];
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

  /** Fixed across runs on purpose: this analysis measures one party's access to accuracy, so
   * varying the classes would fold class growth differences into the loot figures. */
  nextPartyClasses() {
    return SIMULATED_PARTY_CLASSES;
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

    // one pool for the whole walk: every drop stays a candidate for its slot, and re-selecting each
    // room lets a later item displace an earlier one rather than both counting
    const pool = new EquipmentPoolBySlot();

    visits.forEach((visit, index) => {
      for (const equipment of visit.equipmentDropped) {
        pool.add(equipment);
      }

      const samples = this.samplesByRoom[index];
      invariant(samples !== undefined, "a visited room has no sample collector");

      const characterCount = visit.characters.length;
      const worn = pool.selectEquipped(characterCount, EquipmentAccuracy.scoreOf);
      const equipped = EquipmentAccuracy.sum(
        worn.map((equipment) => EquipmentAccuracy.of(equipment))
      );

      samples.fromAccuracyAffixes.push(equipped.fromAccuracyAffixes / characterCount);
      samples.fromDexterity.push(equipped.fromDexterity / characterCount);
      samples.fromEquipped.push(EquipmentAccuracy.total(equipped) / characterCount);

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
        fromEquipped: distributionOf(samples.fromEquipped),
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
