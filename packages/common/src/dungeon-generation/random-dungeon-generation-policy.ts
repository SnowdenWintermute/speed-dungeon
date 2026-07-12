import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { EMPTY_ROOMS_PER_FLOOR, GAME_CONFIG } from "../app-consts.js";
import { Combatant } from "../combatants/index.js";
import { MonsterGenerator } from "../monsters/monster-generator.js";
import { ArrayUtils } from "../utils/array-utils.js";
import {
  DungeonGenerationPolicy,
  DungeonRoomWithMonsters,
  ExplicitCombatantDungeonTemplate,
} from "./index.js";
import {
  FALLBACK_MONSTER_SPAWN_TABLE,
  MONSTER_SPAWN_TABLES,
  pickWeighted,
} from "./monster-types-by-floor.js";

export class RandomDungeonGenerationPolicy extends DungeonGenerationPolicy {
  private monsterGenerator = new MonsterGenerator(
    this.idGenerator,
    this.itemBuilder,
    this.rngPolicy.monsterEquipment
  );
  setExplicitFloors(_floors: ExplicitCombatantDungeonTemplate): void {
    throw new Error("Cannot set explicit floors on RandomDungeonGenerationPolicy");
  }

  generateUnexploredRoomTypesOnFloor(floorLevel: number): DungeonRoomType[] {
    const firstRooms: DungeonRoomType[] = [];
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

    ArrayUtils.shuffle(mainRooms, this.rngPolicy.dungeonLayout);

    lastRooms.push(DungeonRoomType.VendingMachine);
    lastRooms.push(DungeonRoomType.Staircase);

    // reverse because we pop from the end when getting next room to generate
    const result = [...firstRooms, ...mainRooms, ...lastRooms].reverse();

    // result.push(DungeonRoomType.VendingMachine); // TESTING
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
    const floorSpawnTable = MONSTER_SPAWN_TABLES[floorLevel];

    for (let i = 0; i < GAME_CONFIG.MONSTERS_PER_ROOM_COUNT; i += 1) {
      const monsterType = pickWeighted(floorSpawnTable || FALLBACK_MONSTER_SPAWN_TABLE).monster;
      const newMonster = this.monsterGenerator.generate(monsterType, floorLevel);
      monsters.push(newMonster);
    }

    return { room, monsters };
  }
}
