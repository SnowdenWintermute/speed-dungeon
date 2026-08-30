import { invariant, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import type { Combatant } from "@speed-dungeon/common";
import { roomKey } from "../analysis-runs/analysis-sample.ts";
import type { CopiedAttributeProfileRoom } from "./attribute-source.ts";

/**
 * One character's attributes as another study measured them, room by room. The character is switched
 * to explicit attributes, so what it reports is this profile and nothing else: not its class tables,
 * not the gear it is wearing. That is the point — the copied numbers already include what the
 * measured build's own gear gave it, so counting this character's gear again would pay for it twice,
 * and the requirement gate is meant to ask what a real build could wear here, not what this fiction
 * bootstrapped itself into.
 */
export class CopiedAttributeProfile {
  private roomsByKey = new Map<string, CopiedAttributeProfileRoom>();
  private lastRoomByFloor = new Map<number, CopiedAttributeProfileRoom>();

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
      this.roomsByKey.set(roomKey(room), room);
      const lastOnFloor = this.lastRoomByFloor.get(room.floor);
      if (lastOnFloor === undefined || lastOnFloor.room < room.room) {
        this.lastRoomByFloor.set(room.floor, room);
      }
    }

    combatant.getCombatantProperties().attributeProperties.setUseExplicitAttributes();
  }

  /** a run can out-walk the rooms its source reached on a floor, which the last row there covers */
  private requireForRoom(location: { floor: number; room: number }) {
    const exact = this.roomsByKey.get(roomKey(location));
    if (exact !== undefined) {
      return exact;
    }

    const lastOnFloor = this.lastRoomByFloor.get(location.floor);
    invariant(
      lastOnFloor !== undefined,
      `${this.describeSource} reached floor ${location.floor} where its source study has no samples`
    );

    return lastOnFloor;
  }

  applyForRoom(location: { floor: number; room: number }) {
    const { attributeProperties } = this.combatant.getCombatantProperties();
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(
      this.requireForRoom(location).attributes
    )) {
      attributeProperties.setSpeccedAttributeValue(attribute, value);
    }
  }
}
