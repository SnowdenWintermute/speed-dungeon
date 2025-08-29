import { DungeonRoomType } from "../../adventuring-party/dungeon-room.js";
import { CombatantProperties, Inventory } from "../../combatants/index.js";

export function combatantIsAllowedToTradeForBooks(
  combatantProperties: CombatantProperties,
  currentRoomType: DungeonRoomType
) {
  const atVendingMachine = currentRoomType === DungeonRoomType.VendingMachine;
  return atVendingMachine;
}
