import {
  Combatant,
  DungeonRoom,
  DungeonRoomType,
  NUM_MONSTERS_PER_ROOM,
} from "@speed-dungeon/common";
import generateMonster from "../monster-generation/index.js";

export default function generateDungeonRoom(floor: number, roomType: DungeonRoomType): DungeonRoom {
  const monsters: { [entityId: string]: Combatant } = {};
  const monsterPositions: string[] = [];
  if (roomType === DungeonRoomType.MonsterLair) {
    for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
      const newMonster = generateMonster(floor + i);
      const monsterId = newMonster.entityProperties.id;
      monsters[monsterId] = newMonster;
      monsterPositions.push(monsterId);
    }
  }

  return new DungeonRoom(roomType, monsters, monsterPositions);
}
