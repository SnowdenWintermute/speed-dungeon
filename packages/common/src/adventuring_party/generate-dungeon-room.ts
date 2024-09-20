import { NUM_MONSTERS_PER_ROOM } from "../app_consts.js";
import { IdGenerator } from "../game/id-generator.js";
import { Monster } from "../monsters/index.js";
import generateMonster from "../monsters/generate-monster.js";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room.js";

export default function generateDungeonRoom(
  idGenerator: IdGenerator,
  floor: number,
  roomType: DungeonRoomType
): DungeonRoom {
  const monsters: { [entityId: string]: Monster } = {};
  if (roomType === DungeonRoomType.MonsterLair) {
    for (let i = 0; i < NUM_MONSTERS_PER_ROOM; i += 1) {
      const newMonster = generateMonster(idGenerator, floor);
      monsters[newMonster.entityProperties.id] = newMonster;
    }
  }

  return new DungeonRoom(roomType, monsters);
}
