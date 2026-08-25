import { EquipmentType, MapUtils } from "@speed-dungeon/common";
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
}
