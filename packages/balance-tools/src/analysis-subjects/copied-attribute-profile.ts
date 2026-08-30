import {
  ArrayUtils,
  COMBAT_ATTRIBUTES,
  CombatAttribute,
  invariant,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import type { Combatant } from "@speed-dungeon/common";
import { AnalysisSampleDimensions, RoomGroupedSamples } from "../analysis-runs/analysis-sample.ts";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import type { CopiedAttributeProfileRoom } from "./attribute-source.ts";

/**
 * The copied numbers already include what the measured build's own gear gave it, so the character is
 * switched to explicit attributes rather than left to total its own — counting the gear it is
 * standing in would pay for that gear twice.
 */
export class CopiedAttributeProfile {
  private roomsByFloor = new Map<number, CopiedAttributeProfileRoom[]>();

  constructor(
    private combatant: Combatant,
    private describeSource: string,
    rooms: CopiedAttributeProfileRoom[]
  ) {
    invariant(
      rooms.length > 0,
      `${describeSource} has no rooms to copy attributes from — its source study's saved run was ` +
        `never read, or holds no samples for the build it names`
    );

    for (const room of rooms) {
      const roomsOnFloor = this.roomsByFloor.get(room.floor);
      if (roomsOnFloor === undefined) {
        this.roomsByFloor.set(room.floor, [room]);
      } else {
        roomsOnFloor.push(room);
      }
    }

    for (const roomsOnFloor of this.roomsByFloor.values()) {
      roomsOnFloor.sort((a, b) => a.room - b.room);
    }

    combatant.getCombatantProperties().attributeProperties.setUseExplicitAttributes();
  }

  private selectNearestRoomAtOrBelow(location: { floor: number; room: number }) {
    const roomsOnFloor = this.roomsByFloor.get(location.floor) ?? [];
    const [firstOnFloor] = roomsOnFloor;
    invariant(
      firstOnFloor !== undefined,
      `${this.describeSource} reached floor ${location.floor} where its source study has no samples`
    );

    let nearest = null;
    for (const room of roomsOnFloor) {
      if (room.room > location.room) {
        break;
      }
      nearest = room;
    }

    return nearest ?? firstOnFloor;
  }

  applyForRoom(location: { floor: number; room: number }) {
    const { attributeProperties } = this.combatant.getCombatantProperties();
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(
      this.selectNearestRoomAtOrBelow(location).attributes
    )) {
      attributeProperties.setSpeccedAttributeValue(attribute, value);
    }
  }

  /**
   * Every sample carries the attributes behind whatever its own study measured, so reading a profile
   * out of another study needs none of that study's table.
   */
  static selectRooms(
    samples: readonly AnalysisSampleDimensions[],
    slice: AnalysisSlice
  ): CopiedAttributeProfileRoom[] {
    return new RoomGroupedSamples(samples)
      .selectRooms(slice)
      .map(({ floor, room, samples: samplesInRoom }) => ({
        floor,
        room,
        attributes: CopiedAttributeProfile.meanAttributes(samplesInRoom),
      }));
  }

  /**
   * Rounded rather than floored, because the requirement generator rounds the same means when it
   * turns them into gates — a character pinned to the floor of a mean it was gated on would miss its
   * own requirement by a point in the room that requirement was anchored to. Armor class is left out
   * because it is what a copying study measures.
   */
  private static meanAttributes(samples: AnalysisSampleDimensions[]) {
    const attributes: Partial<Record<CombatAttribute, number>> = {};

    for (const attribute of COMBAT_ATTRIBUTES) {
      if (attribute === CombatAttribute.ArmorClass) {
        continue;
      }
      attributes[attribute] = Math.round(
        ArrayUtils.average(samples.map((sample) => sample.totalAttributes[attribute]))
      );
    }

    return attributes;
  }
}
