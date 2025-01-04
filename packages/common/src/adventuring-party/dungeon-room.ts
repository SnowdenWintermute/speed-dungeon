import { Combatant, Inventory } from "../combatants/index.js";

export class DungeonRoom {
  inventory: Inventory = new Inventory();

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

export const DUNGEON_ROOM_TYPE_STRINGS: Record<DungeonRoomType, string> = {
  [DungeonRoomType.MonsterLair]: "Monster Lair",
  [DungeonRoomType.Staircase]: "Staircase",
  [DungeonRoomType.Empty]: "Empty",
};
