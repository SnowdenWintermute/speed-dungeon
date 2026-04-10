import { DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import {
  ExplicitCombatantDungeonTemplate,
  ExplicitCombatantRoomTemplate,
} from "../dungeon-generation/index.js";
import { MonsterType } from "../monsters/monster-types.js";
import { MONSTER_FIXTURES } from "./monster-fixtures.js";

const ROOM_WITH_TWO_SPIDERS: ExplicitCombatantRoomTemplate = {
  type: DungeonRoomType.MonsterLair,
  combatants: [MONSTER_FIXTURES.SPIDER, MONSTER_FIXTURES.SPIDER],
};
export const TEST_DUNGEON_TWO_SPIDER_ROOMS: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    ROOM_WITH_TWO_SPIDERS,
    ROOM_WITH_TWO_SPIDERS,
    {
      type: DungeonRoomType.Staircase,
    },
  ],
];

const ROOM_WITH_TWO_WOLVES: ExplicitCombatantRoomTemplate = {
  type: DungeonRoomType.MonsterLair,
  combatants: [MONSTER_FIXTURES.WOLF, MONSTER_FIXTURES.WOLF],
};
export const TEST_DUNGEON_TWO_WOLF_ROOMS: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    ROOM_WITH_TWO_WOLVES,
    ROOM_WITH_TWO_WOLVES,
    {
      type: DungeonRoomType.Staircase,
    },
  ],
];

const ROOM_WITH_TWO_ZERO_SPEED_WOLVES: ExplicitCombatantRoomTemplate = {
  type: DungeonRoomType.MonsterLair,
  combatants: [MONSTER_FIXTURES.WOLF_ZERO_SPEED, MONSTER_FIXTURES.WOLF_ZERO_SPEED],
};
export const TEST_DUNGEON_ZERO_SPEED_WOLVES: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    ROOM_WITH_TWO_ZERO_SPEED_WOLVES,
    ROOM_WITH_TWO_ZERO_SPEED_WOLVES,
    {
      type: DungeonRoomType.Staircase,
    },
  ],
];

export const TEST_DUNGEON_ONE_LOW_HP_WOLF_ONE_NORMAL: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF_LOW_HP, MONSTER_FIXTURES.WOLF],
    },
    {
      type: DungeonRoomType.Staircase,
    },
  ],
];

export const EXPLICIT_ATTACK_TEST_DUNGEON: ExplicitCombatantDungeonTemplate = [
  [
    { type: DungeonRoomType.Empty },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF, MONSTER_FIXTURES.WOLF, MONSTER_FIXTURES.WOLF],
    },
    { type: DungeonRoomType.Staircase },
  ],
];
