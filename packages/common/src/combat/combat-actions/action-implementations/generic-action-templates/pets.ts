import { EntityId } from "../../../../aliases.js";

export interface PetSlot {
  ownerId: EntityId;
  slotIndex: number;
}
