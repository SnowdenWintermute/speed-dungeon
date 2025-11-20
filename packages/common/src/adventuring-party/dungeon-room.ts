import { plainToInstance } from "class-transformer";
import { Inventory } from "../combatants/index.js";
import { runIfInBrowser } from "../utils/index.js";
import { makeAutoObservable } from "mobx";

export class DungeonRoom {
  inventory: Inventory = new Inventory();

  constructor(public roomType: DungeonRoomType) {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(dungeonRoom: DungeonRoom) {
    dungeonRoom.inventory = Inventory.getDeserialized(dungeonRoom.inventory);
    return plainToInstance(DungeonRoom, dungeonRoom);
  }
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
