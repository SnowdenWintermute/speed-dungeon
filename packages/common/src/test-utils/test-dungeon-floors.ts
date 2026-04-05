import { DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { MonsterGenerationProps } from "../dungeon-generation/index.js";
import { MonsterType } from "../monsters/monster-types.js";

const ROOM_WITH_TWO_WOLVES = {
  type: DungeonRoomType.MonsterLair,
  monsters: [
    { type: MonsterType.Wolf, level: 1 },
    { type: MonsterType.Wolf, level: 1 },
  ],
};

export const TEST_DUNGEON_SIMPLE: {
  type: DungeonRoomType;
  monsters?: MonsterGenerationProps[];
}[][] = [
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
  [
    {
      type: DungeonRoomType.MonsterLair,
      monsters: [{ type: MonsterType.Wolf, level: 1 }],
    },
  ],
];
