import { makeAutoObservable } from "mobx";
import { Inventory } from "../combatants/inventory/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";

export class DungeonRoom implements Serializable, ReactiveNode {
  inventory: Inventory = new Inventory();

  constructor(public roomType: DungeonRoomType) {}

  makeObservable() {
    makeAutoObservable(this);
    this.inventory.makeObservable();
  }

  toSerialized() {
    return { roomType: this.roomType, inventory: this.inventory.toSerialized() };
  }

  static fromSerialized(serialized: SerializedOf<DungeonRoom>) {
    const result = new DungeonRoom(serialized.roomType);
    result.inventory = Inventory.fromSerialized(serialized.inventory);
    return result;
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
