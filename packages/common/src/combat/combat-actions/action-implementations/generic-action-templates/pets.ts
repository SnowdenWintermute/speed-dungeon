import { EntityId } from "../../../../primatives/index.js";

export interface PetSlot {
  ownerId: EntityId;
  slotIndex: number;
}
