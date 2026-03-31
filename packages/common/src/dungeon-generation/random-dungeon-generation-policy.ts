import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { EMPTY_ROOMS_PER_FLOOR, GAME_CONFIG, NUM_MONSTERS_PER_ROOM } from "../app-consts.js";
import { Combatant } from "../combatants/index.js";
import { generateMonster } from "../monsters/generate-monster.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { DungeonGenerationPolicy, DungeonRoomWithMonsters } from "./index.js";

export class RandomDungeonGenerationPolicy extends DungeonGenerationPolicy {
  generateUnexploredRoomTypesOnFloor(floorLevel: number): DungeonRoomType[] {
    const firstRooms = [];
    const mainRooms = [];
    const lastRooms = [];

    if (floorLevel === 1) {
      firstRooms.push(DungeonRoomType.Empty);
    }

    for (let i = 0; i < EMPTY_ROOMS_PER_FLOOR; i += 1) {
      mainRooms.push(DungeonRoomType.Empty);
    }

    for (let i = 0; i < GAME_CONFIG.MONSTER_LAIRS_PER_FLOOR; i += 1) {
      mainRooms.push(DungeonRoomType.MonsterLair);
    }

    ArrayUtils.shuffle(mainRooms);

    // result.push(DungeonRoomType.VendingMachine); // TESTING

    lastRooms.push(DungeonRoomType.VendingMachine);
    lastRooms.push(DungeonRoomType.Staircase);

    // reverse because we pop from the end when getting next room to generate
    const result = [...firstRooms, ...mainRooms, ...lastRooms].reverse();

    return result;
  }

  generateDungeonRoom(
    floorLevel: number,
    roomType: DungeonRoomType,
    roomIndex: number
  ): DungeonRoomWithMonsters {
    const room = new DungeonRoom(roomType);
    const shouldHaveMonsters = roomType === DungeonRoomType.MonsterLair;
    if (!shouldHaveMonsters) {
      return { room, monsters: [] };
    }

    const monsters: Combatant[] = [];

    for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
      const newMonster = generateMonster(
        floorLevel,
        roomIndex,
        this.idGenerator,
        this.itemGenerator,
        this.randomNumberGenerator
      );

      monsters.push(newMonster);
    }

    return { room, monsters };
  }
}
