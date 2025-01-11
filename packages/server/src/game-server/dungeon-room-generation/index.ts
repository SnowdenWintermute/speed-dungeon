import {
  Combatant,
  ConsumableType,
  DungeonRoom,
  DungeonRoomType,
  MonsterType,
  NUM_MONSTERS_PER_ROOM,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import generateMonster from "../monster-generation/index.js";
import { createConsumableByType } from "../item-generation/create-consumable-by-type.js";

export default function generateDungeonRoom(floor: number, roomType: DungeonRoomType): DungeonRoom {
  const monsters: { [entityId: string]: Combatant } = {};
  const monsterPositions: string[] = [];
  if (roomType === DungeonRoomType.MonsterLair) {
    for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
      const newMonster = generateMonster(floor);
      // for (const monsterType of [
      //   MonsterType.FireElemental,
      //   // MonsterType.IceElemental,
      //   // MonsterType.Scavenger,
      //   // MonsterType.Cultist,
      //   // MonsterType.Zombie,
      //   // MonsterType.FireMage,
      //   // MonsterType.MetallicGolem,
      //   // MonsterType.Vulture,
      // ]) {
      //   const newMonster = generateMonster(floor, monsterType);
      const monsterId = newMonster.entityProperties.id;
      monsters[monsterId] = newMonster;
      monsterPositions.push(monsterId);
    }
  }

  const room = new DungeonRoom(roomType, monsters, monsterPositions);

  // @TODO @TESTING - remove before deployment
  room.inventory.consumables.push(
    ...new Array(20).fill(null).map(() => createConsumableByType(ConsumableType.MpAutoinjector))
  );

  return room;
}
