import { CharacterSlotIndex, EntityId } from "../../../aliases.js";
import { Combatant } from "../../../combatants/index.js";
import { SerializedOf } from "../../../serialization/index.js";

export interface CharacterInSlot {
  combatant: SerializedOf<Combatant>;
  pets: SerializedOf<Combatant>[];
}

export type SavedCharacterSlots = Record<CharacterSlotIndex, CharacterInSlot>;

export class CharacterSlot {
  characterId: null | EntityId = null;
  createdAt: number | Date = Date.now();
  updatedAt: number | Date = Date.now();

  constructor(
    public id: string,
    public profileId: number,
    public slotNumber: CharacterSlotIndex
  ) {}
}
