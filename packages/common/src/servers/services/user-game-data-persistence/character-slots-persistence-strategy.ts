import { ProfileId } from "../../../aliases.js";
import { CharacterControlScheme, GameMode } from "../../../game-modes/index.js";
import { CharacterSlot } from "./character-slots.js";

export interface CharacterSlotsPersistenceStrategy {
  fetchSlots: (
    profileId: ProfileId,
    gameMode: GameMode,
    controlScheme: CharacterControlScheme
  ) => Promise<CharacterSlot[]>;
  createSlots: (profileId: ProfileId) => Promise<void>;
  update: (characterSlot: CharacterSlot) => Promise<CharacterSlot>;
}
