import {
  ArrayUtils,
  EquipmentBaseItem,
  EquipmentType,
  MapUtils,
  NormalizedPercentage,
} from "@speed-dungeon/common";
import {
  EquipmentBaseItemTally,
  TalliedBaseItem,
} from "@/analysis-subjects/equipment-base-item-tally";
import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { AnalysisSampleDimensions, roomKey } from "./analysis-sample";

/**
 * What dropped is a fact about the party, not about any one character, so availability is recorded
 * once per room rather than copied onto each character's sample.
 */
export interface RoomAvailability {
  runIndex: number;
  floor: number;
  room: number;
  /** every base item dropped since the run began, not only this room's drops */
  availableEquipment: TalliedBaseItem[];
}

/** one room's point on a base item's cumulative drop curve */
export interface AvailabilityPoint {
  floor: number;
  room: number;
  percentOfRuns: NormalizedPercentage;
}

export class RoomAvailabilityIndex {
  private byRoom = new Map<string, RoomAvailability[]>();

  constructor(availability: RoomAvailability[]) {
    for (const roomAvailability of availability) {
      MapUtils.getOrCreate(this.byRoom, roomKey(roomAvailability), () => []).push(roomAvailability);
    }
  }

  /**
   * What dropped is a fact about the party, so this counts distinct runs. The room's availability
   * is recorded once per run, and only the runs that contributed a matching character are counted,
   * so widening the slice cannot make an item look more available than it was.
   */
  selectHoldablePercentages(
    location: { floor: number; room: number },
    samples: AnalysisSampleDimensions[]
  ) {
    const usedHoldableTypes = new Set<EquipmentType>();
    const matchedRunIndexes = new Set<number>();

    for (const sample of samples) {
      for (const equipmentType of AnalysisCharacterSpecification.getUsedHoldableTypes(
        sample.weaponSpecialty
      )) {
        usedHoldableTypes.add(equipmentType);
      }
      matchedRunIndexes.add(sample.runIndex);
    }

    const roomAvailability = (this.byRoom.get(roomKey(location)) ?? []).filter(({ runIndex }) =>
      matchedRunIndexes.has(runIndex)
    );

    const tally = new EquipmentBaseItemTally();
    for (const { availableEquipment } of roomAvailability) {
      for (const { baseItem } of availableEquipment) {
        if (usedHoldableTypes.has(baseItem.equipmentType)) {
          tally.add(baseItem);
        }
      }
    }

    return tally.toPercentages(roomAvailability.length);
  }

  /**
   * How likely a base item is to have dropped by each room, in the order the party walks them. Not
   * narrowed to what any build uses, unlike the holdable percentages above: an item's drop rate is a
   * fact about the dungeon, not about who wants it.
   *
   * Each room divides by the runs that reached it, so a room only some runs report can read lower
   * than the room before it — read the ceiling off the whole curve, not off its last point.
   */
  selectAvailabilityCurve(baseItem: EquipmentBaseItem): AvailabilityPoint[] {
    const points: AvailabilityPoint[] = [];

    for (const roomAvailability of this.byRoom.values()) {
      const { floor, room } = ArrayUtils.getExpectedAtIndex(roomAvailability, 0);
      const runsWithItem = roomAvailability.filter(({ availableEquipment }) =>
        availableEquipment.some(
          (tallied) =>
            tallied.baseItem.equipmentType === baseItem.equipmentType &&
            tallied.baseItem.baseItemType === baseItem.baseItemType
        )
      ).length;

      points.push({ floor, room, percentOfRuns: runsWithItem / roomAvailability.length });
    }

    return points.sort((a, b) => a.floor - b.floor || a.room - b.room);
  }
}
