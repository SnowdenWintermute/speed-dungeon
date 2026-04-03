import { DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { MonsterGenerationProps } from "../dungeon-generation/index.js";
import { MonsterType } from "../monsters/monster-types.js";

export const TEST_DUNGEON_SIMPLE: {
  type: DungeonRoomType;
  monsters?: MonsterGenerationProps[];
}[][] = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      monsters: [{ type: MonsterType.Wolf, level: 1 }],
    },
    {
      type: DungeonRoomType.MonsterLair,
      monsters: [{ type: MonsterType.Wolf, level: 1 }],
    },
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
