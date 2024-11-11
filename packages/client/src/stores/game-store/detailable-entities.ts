import { Combatant, Item } from "@speed-dungeon/common";

export enum DetailableEntityType {
  Combatant,
  Item,
}

export interface ItemDetailable {
  type: DetailableEntityType.Item;
  item: Item;
}

export interface CombatantDetailable {
  type: DetailableEntityType.Combatant;
  combatant: Combatant;
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
