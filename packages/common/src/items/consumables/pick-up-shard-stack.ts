import { Consumable } from "./index.js";
import { Inventory } from "../../combatants/index.js";
import { EntityId } from "../../primatives/index.js";

export function pickUpShardStack(
  stackId: EntityId,
  inventoryFrom: Inventory,
  inventoryTo: Inventory
) {
  const shardStackResult = inventoryFrom.removeItem(stackId);
  if (shardStackResult instanceof Error) return shardStackResult;
  if (!(shardStackResult instanceof Consumable)) return new Error("checked expectation failed");
  inventoryTo.shards += shardStackResult.usesRemaining;
}
