import {
  Combatant,
  DungeonRoom,
  DungeonRoomType,
  NUM_MONSTERS_PER_ROOM,
} from "@speed-dungeon/common";
import { generateMonster } from "../monster-generation/index.js";

export function generateDungeonRoom(floor: number, roomType: DungeonRoomType): DungeonRoom {
  const monsters: { [entityId: string]: Combatant } = {};
  const monsterPositions: string[] = [];
  if (roomType === DungeonRoomType.MonsterLair) {
    for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
      const newMonster = generateMonster(floor);
      // for (let i = 0; i < 3; i += 1) {
      //   const newMonster = generateMonster(i + 1, MonsterType.FireMage);
      const monsterId = newMonster.entityProperties.id;
      monsters[monsterId] = newMonster;
      monsterPositions.push(monsterId);
    }
  }

  const room = new DungeonRoom(roomType, monsters, monsterPositions);

  return room;
}
