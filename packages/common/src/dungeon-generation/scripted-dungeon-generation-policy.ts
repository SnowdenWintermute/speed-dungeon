import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { NUM_MONSTERS_PER_ROOM } from "../app-consts.js";
import { Combatant } from "../combatants/index.js";
import { generateMonster } from "../monsters/generate-monster.js";
import { DungeonGenerationPolicy, DungeonRoomWithMonsters } from "./index.js";

export class ScriptedDungeonGenerationPolicy extends DungeonGenerationPolicy {
  configureScript() {
    // set some internal script to use
  }

  generateUnexploredRoomTypesOnFloor(floorLevel: number): DungeonRoomType[] {
    // const firstRooms = [];
    // const mainRooms = [];
    // const lastRooms = [];

    // // reverse because we pop from the end when getting next room to generate
    // const result = [...firstRooms, ...mainRooms, ...lastRooms].reverse();

    const result: DungeonRoomType[] = []; // placeholder
    return result;
  }

  generateDungeonRoom(
    floorLevel: number,
    roomType: DungeonRoomType,
    roomIndex: number
  ): DungeonRoomWithMonsters {
    const room = new DungeonRoom(roomType);

    // use scripted monsters

    return { room, monsters: [] };
  }
}
