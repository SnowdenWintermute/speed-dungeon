import { IdGenerator } from "../game/id_generator";
import { Monster } from "../monsters";
import generateMonster from "../monsters/generate-monster";
import { DungeonRoom, DungeonRoomType } from "./dungeon-room";

const NUM_MONSTERS_PER_ROOM = 3;

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
