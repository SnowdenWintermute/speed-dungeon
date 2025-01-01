import {
  Combatant,
  DungeonRoom,
  DungeonRoomType,
  MonsterType,
  NUM_MONSTERS_PER_ROOM,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import generateMonster from "../monster-generation/index.js";

export default function generateDungeonRoom(floor: number, roomType: DungeonRoomType): DungeonRoom {
  const monsters: { [entityId: string]: Combatant } = {};
  const monsterPositions: string[] = [];
  if (roomType === DungeonRoomType.MonsterLair) {
    // for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
    //   const newMonster = generateMonster(floor);
    for (const monsterType of [
      MonsterType.IceElemental,
      // MonsterType.FireElemental,
      MonsterType.Scavenger,
      // MonsterType.Zombie,
      // MonsterType.FireMage,
      // MonsterType.Cultist,
      // MonsterType.MetallicGolem,
      // MonsterType.Vulture,
    ]) {
      const newMonster = generateMonster(floor, monsterType);
      const monsterId = newMonster.entityProperties.id;
      monsters[monsterId] = newMonster;
      monsterPositions.push(monsterId);
    }
  }

  return new DungeonRoom(roomType, monsters, monsterPositions);
}
