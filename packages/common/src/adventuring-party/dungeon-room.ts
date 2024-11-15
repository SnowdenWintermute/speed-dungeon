import { Combatant } from "../combatants/index.js";
import { Item } from "../items/index.js";

export class DungeonRoom {
  items: Item[] = [];

  constructor(
    public roomType: DungeonRoomType,
    public monsters: { [entityId: string]: Combatant },
    public monsterPositions: string[]
  ) {}
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
