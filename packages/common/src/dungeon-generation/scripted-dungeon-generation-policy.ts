import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { invariant } from "../utils/index.js";
import {
  DungeonGenerationPolicy,
  DungeonRoomWithMonsters,
  ExplicitCombatantDungeonTemplate,
  ExplicitCombatantRoomTemplate,
} from "./index.js";

export class ScriptedDungeonGenerationPolicy extends DungeonGenerationPolicy {
  private floors: ExplicitCombatantRoomTemplate[][] = [];

  setExplicitFloors(floors: ExplicitCombatantDungeonTemplate) {
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

    invariant(
      scriptedRoom !== undefined,
      `No scripted room at index ${roomIndex} on floor ${floorLevel}`
    );

    const monsters = (scriptedRoom.combatants ?? []).map((builderFactory) =>
      builderFactory(this.idGenerator, this.itemBuilder, this.rngPolicy).build(this.idGenerator)
    );

    return { room, monsters };
  }

  private getFloorRooms(floorLevel: number): ExplicitCombatantRoomTemplate[] {
    const rooms = this.floors[floorLevel - 1];
    invariant(rooms !== undefined, `No scripted floor definition for floor ${floorLevel}`);
    return rooms;
  }
}
