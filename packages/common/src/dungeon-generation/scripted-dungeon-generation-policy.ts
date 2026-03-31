import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { Combatant } from "../combatants/index.js";
import { invariant } from "../utils/index.js";
import { DungeonGenerationPolicy, DungeonRoomWithMonsters } from "./index.js";

export interface ScriptedRoom {
  type: DungeonRoomType;
  monsters?: Combatant[];
}

export class ScriptedDungeonGenerationPolicy extends DungeonGenerationPolicy {
  private floors: ScriptedRoom[][] = [];

  setFloors(floors: ScriptedRoom[][]) {
    this.floors = floors;
  }

  generateUnexploredRoomTypesOnFloor(floorLevel: number): DungeonRoomType[] {
    const floorRooms = this.getFloorRooms(floorLevel);
    // reverse because the exploration manager pops from the end
    return floorRooms.map((r) => r.type).reverse();
  }

  generateDungeonRoom(
    floorLevel: number,
    roomType: DungeonRoomType,
    roomIndex: number
  ): DungeonRoomWithMonsters {
    const room = new DungeonRoom(roomType);

    if (roomType !== DungeonRoomType.MonsterLair) {
      return { room, monsters: [] };
    }

    const floorRooms = this.getFloorRooms(floorLevel);
    const scriptedRoom = floorRooms[roomIndex];

    invariant(scriptedRoom !== undefined, `No scripted room at index ${roomIndex} on floor ${floorLevel}`);

    return { room, monsters: scriptedRoom.monsters ?? [] };
  }

  private getFloorRooms(floorLevel: number): ScriptedRoom[] {
    const rooms = this.floors[floorLevel - 1];
    invariant(rooms !== undefined, `No scripted floor definition for floor ${floorLevel}`);
    return rooms;
  }
}
