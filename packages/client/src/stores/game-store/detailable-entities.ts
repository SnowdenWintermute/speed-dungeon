import { Combatant, Item } from "@speed-dungeon/common";

export function entityIsDetailed(entityId: string, detailedEntity: null | Combatant | Item) {
  if (!detailedEntity) return false;
  return detailedEntity.entityProperties.id === entityId;
}
