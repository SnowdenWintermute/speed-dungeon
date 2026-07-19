import { DungeonRoom, DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { DUNGEON_GENERATION_CONFIG, EMPTY_ROOMS_PER_FLOOR, GAME_CONFIG } from "../app-consts.js";
import { Combatant } from "../combatants/index.js";
import { MonsterGenerator } from "../monsters/monster-generator.js";
import {
  MONSTER_LAIR_GENERATION_CAPACITY_BUDGET_COST,
  MONSTER_PALETTE_COST,
} from "../monsters/monster-spawn-sizing.js";
import { MonsterType } from "../monsters/monster-types.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { drawWithinBudget } from "./budget-draw.js";
import {
  DungeonGenerationPolicy,
  DungeonRoomWithMonsters,
  ExplicitCombatantDungeonTemplate,
  FloorPaletteSelection,
} from "./index.js";
import {
  BOSS_SPAWN_TABLES,
  FALLBACK_MONSTER_SPAWN_TABLE,
  MONSTER_SPAWN_TABLES,
  MonsterSpawnEntry,
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

  generateUnexploredRoomTypesOnFloor(
    floorLevel: number,
    includeBossRoom: boolean
  ): DungeonRoomType[] {
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

    if (includeBossRoom) {
      lastRooms.push(DungeonRoomType.BossLair);
    }
    lastRooms.push(DungeonRoomType.VendingMachine);
    lastRooms.push(DungeonRoomType.Staircase);

    // reverse because we pop from the end when getting next room to generate
    return [...firstRooms, ...mainRooms, ...lastRooms].reverse();
  }

  generateFloorPalette(floorLevel: number): FloorPaletteSelection {
    const floorSpawnTable = MONSTER_SPAWN_TABLES[floorLevel] || FALLBACK_MONSTER_SPAWN_TABLE;

    const palette = drawWithinBudget(
      floorSpawnTable,
      (entry) => entry.paletteWeight,
      (entry) => MONSTER_PALETTE_COST[entry.monster],
      {
        budget: DUNGEON_GENERATION_CONFIG.FLOOR_PALETTE_BUDGET,
        stopFraction: DUNGEON_GENERATION_CONFIG.BUDGET_STOP_FRACTION,
        overflowFraction: DUNGEON_GENERATION_CONFIG.BUDGET_OVERFLOW_FRACTION,
        withReplacement: false,
      },
      this.rngPolicy.floorPaletteSelection
    );

    return { palette, boss: this.chooseBoss(floorLevel) };
  }

  private chooseBoss(floorLevel: number): MonsterType | null {
    const bossTable = BOSS_SPAWN_TABLES[floorLevel];
    if (!bossTable) {
      return null;
    }
    const chosen = ArrayUtils.chooseWeighted(bossTable, this.rngPolicy.bossSelection);
    return chosen?.monster ?? null;
  }

  generateDungeonRoom(
    floorLevel: number,
    roomType: DungeonRoomType,
    _roomIndex: number,
    palette: MonsterSpawnEntry[],
    boss: MonsterType | null
  ): DungeonRoomWithMonsters {
    const room = new DungeonRoom(roomType);
    const isCombatRoom =
      roomType === DungeonRoomType.MonsterLair || roomType === DungeonRoomType.BossLair;
    if (!isCombatRoom) {
      return { room, monsters: [] };
    }

    const monsters: Combatant[] = [];
    let roomBudget = DUNGEON_GENERATION_CONFIG.ROOM_FILL_BUDGET;

    if (roomType === DungeonRoomType.BossLair && boss !== null) {
      monsters.push(this.monsterGenerator.generate(boss, floorLevel));
      roomBudget = Math.max(0, roomBudget - MONSTER_LAIR_GENERATION_CAPACITY_BUDGET_COST[boss]);
    }

    const fillEntries = drawWithinBudget(
      palette,
      (entry) => entry.roomWeight,
      (entry) => MONSTER_LAIR_GENERATION_CAPACITY_BUDGET_COST[entry.monster],
      {
        budget: roomBudget,
        stopFraction: DUNGEON_GENERATION_CONFIG.BUDGET_STOP_FRACTION,
        overflowFraction: DUNGEON_GENERATION_CONFIG.BUDGET_OVERFLOW_FRACTION,
        withReplacement: true,
      },
      this.rngPolicy.roomFillSelection
    );

    for (const entry of fillEntries) {
      monsters.push(this.monsterGenerator.generate(entry.monster, floorLevel));
    }

    return { room, monsters };
  }
}
