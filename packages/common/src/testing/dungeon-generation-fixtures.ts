import { DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import {
  ExplicitCombatantDungeonTemplate,
  ExplicitCombatantRoomTemplate,
} from "../dungeon-generation/index.js";
import { MONSTER_FIXTURES } from "./monster-fixtures.js";

export const TEST_DUNGEON_EMPTY_ROOMS_WITH_STAIRCASE: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Staircase,
    },
  ],
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.Staircase,
    },
  ],
];

// three floors, each a single immediately-descendable staircase room, so a run can descend twice
// (recording floor 1 and floor 2 clears) without exploring or escaping the dungeon — used to test
// cumulative floor timing across multiple recorded floor clears.
export const TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE: ExplicitCombatantDungeonTemplate = [
  [{ type: DungeonRoomType.Staircase }],
  [{ type: DungeonRoomType.Staircase }],
  [{ type: DungeonRoomType.Staircase }],
];

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
  ],
];

export const TEST_DUNGEON_TWO_ONE_HP_WOLVES: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF_ONE_HP, MONSTER_FIXTURES.WOLF_ONE_HP],
    },
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF_ONE_HP, MONSTER_FIXTURES.WOLF_ONE_HP],
    },
  ],
];

export const TEST_DUNGEON_FOUR_ONE_HP_WOLVES: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [
        MONSTER_FIXTURES.WOLF_ONE_HP,
        MONSTER_FIXTURES.WOLF_ONE_HP,
        MONSTER_FIXTURES.WOLF_ONE_HP,
        MONSTER_FIXTURES.WOLF_ONE_HP,
      ],
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [
        MONSTER_FIXTURES.WOLF_ONE_HP,
        MONSTER_FIXTURES.WOLF_ONE_HP,
        MONSTER_FIXTURES.WOLF_ONE_HP,
        MONSTER_FIXTURES.WOLF_ONE_HP,
      ],
    },
  ],
];
export const TEST_DUNGEON_TWO_TWO_HP_WOLVES: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF_TWO_HP, MONSTER_FIXTURES.WOLF_TWO_HP],
    },
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF_TWO_HP, MONSTER_FIXTURES.WOLF_TWO_HP],
    },
  ],
];

const ROOM_WITH_TWO_ZERO_SPEED_WOLVES: ExplicitCombatantRoomTemplate = {
  type: DungeonRoomType.MonsterLair,
  combatants: [MONSTER_FIXTURES.WOLF_ZERO_SPEED, MONSTER_FIXTURES.WOLF_ZERO_SPEED],
};
export const TEST_DUNGEON_ZERO_SPEED_WOLVES: ExplicitCombatantDungeonTemplate = [
  [{ type: DungeonRoomType.Empty }, ROOM_WITH_TWO_ZERO_SPEED_WOLVES],
];

export const TEST_DUNGEON_ONE_ONE_HP_WOLF_ONE_NORMAL: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF_ONE_HP, MONSTER_FIXTURES.WOLF],
    },
  ],
];

export const TEST_DUNGEON_ONE_TWO_HP_WOLF_ONE_NORMAL: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF_TWO_HP, MONSTER_FIXTURES.WOLF],
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
  ],
];

export const TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF_ZERO_SPEED, MONSTER_FIXTURES.CULTIST_ZERO_SPEED],
    },
  ],
];

export const TEST_DUNGEON_WOLF_AND_SLOW_SPIDER_LOTS_OF_MANA: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF, MONSTER_FIXTURES.SPIDER_SLOW_LOTS_OF_MANA],
    },
  ],
];

export const TEST_DUNGEON_MANTA_TWO_WOLF: ExplicitCombatantDungeonTemplate = [
  [
    { type: DungeonRoomType.Empty },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF, MONSTER_FIXTURES.WOLF_ONE_HP, MONSTER_FIXTURES.MANTA_RAY],
    },
  ],
];

const ROOM_WITH_TWO_ZERO_SPEED_MANTAS: ExplicitCombatantRoomTemplate = {
  type: DungeonRoomType.MonsterLair,
  combatants: [MONSTER_FIXTURES.ZERO_SPEED_MANTA_RAY, MONSTER_FIXTURES.ZERO_SPEED_MANTA_RAY],
};
export const TEST_DUNGEON_ZERO_SPEED_MANTAS: ExplicitCombatantDungeonTemplate = [
  [
    { type: DungeonRoomType.Empty },
    ROOM_WITH_TWO_ZERO_SPEED_MANTAS,
    { type: DungeonRoomType.Empty },
    ROOM_WITH_TWO_ZERO_SPEED_MANTAS,
  ],
];
