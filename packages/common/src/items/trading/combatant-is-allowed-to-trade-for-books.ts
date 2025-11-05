import { DungeonRoomType } from "../../adventuring-party/dungeon-room.js";

export function combatantIsAllowedToTradeForBooks(currentRoomType: DungeonRoomType) {
  const atVendingMachine = currentRoomType === DungeonRoomType.VendingMachine;
  return atVendingMachine;
}
