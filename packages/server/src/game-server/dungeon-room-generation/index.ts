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
  roomType: DungeonRoomType,
  roomIndex: number
): { room: DungeonRoom; monsters: Combatant[] } {
  const monsters: Combatant[] = [];

  if (roomType === DungeonRoomType.MonsterLair) {
    for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
      const newMonster = generateMonster(floor, roomIndex);

      monsters.push(newMonster);
    }
  }

  const room = new DungeonRoom(roomType);

  return { room, monsters };
}
