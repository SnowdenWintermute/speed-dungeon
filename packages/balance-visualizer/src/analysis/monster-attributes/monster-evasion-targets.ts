import { invariant, MIN_HIT_CHANCE } from "@speed-dungeon/common";
import {
  MonsterAttributeIntensity,
  MONSTER_ATTRIBUTE_INTENSITIES,
  ReferenceCharacterProfile,
  REFERENCE_CHARACTER_PROFILES,
} from "./monster-attribute-intensity";
import { RoomAccuracyAvailability } from "../accuracy-availability/index";

/** The hit rate every intensity is solved for. getActionHitChance reads accuracy as a percentage
 * and subtracts evasion from it, so an evasion target is just this far below the reference
 * character's accuracy. */
export const TARGET_HIT_PERCENTAGE = 90;

export interface FloorEvasionTargets {
  floorNumber: number;
  /** Averaged over the rooms of the floor: monsters are fought throughout a floor, so neither the
   * state on arriving nor on clearing represents a typical encounter. */
  referenceAccuracyByIntensity: Record<MonsterAttributeIntensity, number>;
  evasionByIntensity: Record<MonsterAttributeIntensity, number>;
}

export class MonsterEvasionTargets {
  /** Derived from the accuracy walk rather than a second one, so both tables describe the same
   * runs. */
  static byFloor(rooms: RoomAccuracyAvailability[]): FloorEvasionTargets[] {
    const roomsByFloor = new Map<number, RoomAccuracyAvailability[]>();
    for (const room of rooms) {
      const onFloor = roomsByFloor.get(room.floorNumber) ?? [];
      onFloor.push(room);
      roomsByFloor.set(room.floorNumber, onFloor);
    }

    return [...roomsByFloor.entries()]
      .sort(([a], [b]) => a - b)
      .map(([floorNumber, roomsOnFloor]) => {
        const referenceAccuracyByIntensity = MonsterEvasionTargets.emptyByIntensity();
        const evasionByIntensity = MonsterEvasionTargets.emptyByIntensity();

        for (const intensity of MONSTER_ATTRIBUTE_INTENSITIES) {
          const accuracy = MonsterEvasionTargets.referenceAccuracy(
            roomsOnFloor,
            REFERENCE_CHARACTER_PROFILES[intensity]
          );
          referenceAccuracyByIntensity[intensity] = accuracy;
          evasionByIntensity[intensity] = MonsterEvasionTargets.evasionForAccuracy(accuracy);
        }

        return { floorNumber, referenceAccuracyByIntensity, evasionByIntensity };
      });
  }

  /** Evasion below zero would describe a monster easier to hit than an unopposed swing, which is
   * not a thing the attribute can express. */
  static evasionForAccuracy(referenceAccuracy: number) {
    return Math.max(0, referenceAccuracy - TARGET_HIT_PERCENTAGE);
  }

  /** The hit rate a reference character actually gets against a given evasion, so a hand-set value
   * can be checked rather than only the suggested one read off. */
  static hitPercentageAgainst(referenceAccuracy: number, evasion: number) {
    return Math.max(MIN_HIT_CHANCE, referenceAccuracy - evasion);
  }

  /** A constructed character rather than a percentile of the population: at the level a party
   * typically has reached by this room, with typical loot luck.
   *
   * The two statistics differ on purpose. Level is taken as a mean so the curve interpolates
   * through a level up — a median would snap the whole reference to one side of it and put steps in
   * the curve that flip on sampling noise. Loot is taken as a median because its distribution is
   * right skewed, so a mean would describe a luckier than typical party. */
  private static referenceAccuracy(
    roomsOnFloor: RoomAccuracyAvailability[],
    profile: ReferenceCharacterProfile
  ) {
    invariant(roomsOnFloor.length > 0, "a floor was recorded with no rooms");

    const total = roomsOnFloor.reduce((sum, room) => {
      const { potential, fromEquipped } = room;
      const inherent = profile.characterHasSupportClass
        ? potential.withSupportClass.mean
        : potential.asPlayed.mean;
      const allocatable = profile.characterHasSupportClass
        ? potential.fromAllocatedPointsWithSupportClass.mean
        : potential.fromAllocatedPoints.mean;

      return (
        sum + inherent + profile.characterAllocatedFraction * (allocatable + fromEquipped.median)
      );
    }, 0);

    return total / roomsOnFloor.length;
  }

  private static emptyByIntensity(): Record<MonsterAttributeIntensity, number> {
    return {
      [MonsterAttributeIntensity.VeryLow]: 0,
      [MonsterAttributeIntensity.Low]: 0,
      [MonsterAttributeIntensity.Medium]: 0,
      [MonsterAttributeIntensity.High]: 0,
      [MonsterAttributeIntensity.VeryHigh]: 0,
    };
  }
}
