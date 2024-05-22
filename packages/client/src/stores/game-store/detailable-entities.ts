import { Item } from "@speed-dungeon/common";
import { CombatantDetails } from "@speed-dungeon/common/src/adventuring_party/get-combatant";

export enum DetailableEntityType {
  Combatant,
  Item,
}

interface ItemDetailable {
  type: DetailableEntityType.Item;
  item: Item;
}

interface CombatantDetailable {
  type: DetailableEntityType.Combatant;
  combatant: CombatantDetails;
}

export type DetailableEntity = ItemDetailable | CombatantDetailable;

export function entityIsDetailed(entityId: string, detailedEntity: null | DetailableEntity) {
  if (!detailedEntity) return false;
  switch (detailedEntity.type) {
    case DetailableEntityType.Combatant:
      return detailedEntity.combatant.entityProperties.id === entityId;
    case DetailableEntityType.Item:
      return detailedEntity.item.entityProperties.id === entityId;
  }
}
