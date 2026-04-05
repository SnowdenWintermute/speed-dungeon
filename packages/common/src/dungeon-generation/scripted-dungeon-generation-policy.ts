import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { MonsterGenerator } from "../monsters/monster-generator.js";
import { invariant } from "../utils/index.js";
import {
  DungeonGenerationPolicy,
  DungeonRoomWithMonsters,
  ScriptedRoom,
  ScriptedRoomTemplate,
} from "./index.js";

export class ScriptedDungeonGenerationPolicy extends DungeonGenerationPolicy {
  private floors: ScriptedRoom[][] = [];
  private monsterGenerator: MonsterGenerator | null = null;

  setFloors(floors: ScriptedRoomTemplate[][], monsterGenerator: MonsterGenerator) {
    this.monsterGenerator = monsterGenerator;
    this.floors = floors.map((floor) =>
      floor.map(({ type, monsters }) => ({ type, monsters }))
    );
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

    const { monsterGenerator } = this;
    invariant(monsterGenerator !== null, "Monster generator not set");

    const monsters = (scriptedRoom.monsters ?? []).map((template) =>
      monsterGenerator.generate(template.type, template.level)
    );

    return { room, monsters };
  }

  private getFloorRooms(floorLevel: number): ScriptedRoom[] {
    const rooms = this.floors[floorLevel - 1];
    invariant(rooms !== undefined, `No scripted floor definition for floor ${floorLevel}`);
    return rooms;
  }
}
