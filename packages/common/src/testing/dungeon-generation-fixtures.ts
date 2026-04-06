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
  [
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [CombatantBuilder.monster(MonsterType.Wolf)],
    },
  ],
];

export const EXPLICIT_ATTACK_TEST_DUNGEON: ExplicitCombatantDungeonTemplate = [
  [
    { type: DungeonRoomType.Empty },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [MONSTER_FIXTURES.WOLF],
    },
    { type: DungeonRoomType.Staircase },
  ],
];
