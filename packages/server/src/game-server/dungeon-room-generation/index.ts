import {
  Combatant,
  DungeonRoom,
  DungeonRoomType,
  MonsterType,
  NUM_MONSTERS_PER_ROOM,
} from "@speed-dungeon/common";
import { generateMonster } from "../monster-generation/index.js";

export function generateDungeonRoom(
  floor: number,
  roomType: DungeonRoomType
): { room: DungeonRoom; monsters: Combatant[] } {
  const monsters: Combatant[] = [];

  if (roomType === DungeonRoomType.MonsterLair) {
    for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
      const newMonster = generateMonster(floor);

      monsters.push(newMonster);
    }

    // @TESTING
    // monsters.length = 0;
    // monsters.push(
    //   ...[
    //     generateMonster(floor, MonsterType.Wolf),
    //     generateMonster(floor, MonsterType.Cultist),
    //     generateMonster(floor, MonsterType.MantaRay),
    //   ]
    // );
  }

  const room = new DungeonRoom(roomType);

  return { room, monsters };
}
