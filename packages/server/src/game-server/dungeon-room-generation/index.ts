import {
  Combatant,
  DungeonRoom,
  DungeonRoomType,
  NUM_MONSTERS_PER_ROOM,
} from "@speed-dungeon/common";
import generateMonster from "../monster-generation/index.js";

export default function generateDungeonRoom(floor: number, roomType: DungeonRoomType): DungeonRoom {
  const monsters: { [entityId: string]: Combatant } = {};
  if (roomType === DungeonRoomType.MonsterLair) {
    for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
      const newMonster = generateMonster(floor);
      monsters[newMonster.entityProperties.id] = newMonster;
    }
  }

  return new DungeonRoom(roomType, monsters);
}