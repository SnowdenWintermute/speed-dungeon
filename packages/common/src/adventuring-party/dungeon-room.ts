import { plainToInstance } from "class-transformer";
import { runIfInBrowser } from "../utils/index.js";
import { makeAutoObservable } from "mobx";
import { Inventory } from "../combatants/inventory/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export class DungeonRoom {
  inventory: Inventory = new Inventory();

  constructor(public roomType: DungeonRoomType) {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(dungeonRoom: DungeonRoom) {
    const toReturn = plainToInstance(DungeonRoom, dungeonRoom);
    toReturn.inventory = Inventory.getDeserialized(dungeonRoom.inventory);
    return toReturn;
  }

  requireType(roomType: DungeonRoomType) {
    if (this.roomType !== roomType) {
      throw new Error(ERROR_MESSAGES.PARTY.INCORRECT_ROOM_TYPE);
    }
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
