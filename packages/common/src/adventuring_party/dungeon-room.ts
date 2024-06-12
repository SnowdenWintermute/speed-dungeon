import { Item } from "../items";
import { Monster } from "../monsters";
import generateDungeonRoom from "./generate-dungeon-room";

export class DungeonRoom {
  items: Item[] = [];

  constructor(
    public roomType: DungeonRoomType,
    public monsters: { [entityId: string]: Monster }
  ) {}

  static generate = generateDungeonRoom;
}
export enum DungeonRoomType {
  MonsterLair,
  Staircase,
  Empty,
}

export function formatDungeonRoomType(roomType: DungeonRoomType): string {
  switch (roomType) {
    case DungeonRoomType.MonsterLair:
      return "Monster Lair";
    case DungeonRoomType.Staircase:
      return "Staircase";
    case DungeonRoomType.Empty:
      return "Empty";
  }
}
