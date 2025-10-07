import { Inventory } from "../combatants/index.js";

export class DungeonRoom {
  inventory: Inventory = new Inventory();

  constructor(public roomType: DungeonRoomType) {}
}
export enum DungeonRoomType {
  MonsterLair,
  Staircase,
  Empty,
  VendingMachine,
}

export const DUNGEON_ROOM_TYPE_STRINGS: Record<DungeonRoomType, string> = {
  [DungeonRoomType.MonsterLair]: "Monster Lair",
  [DungeonRoomType.Staircase]: "Staircase",
  [DungeonRoomType.Empty]: "Empty",
  [DungeonRoomType.VendingMachine]: "Vending Machine",
};
