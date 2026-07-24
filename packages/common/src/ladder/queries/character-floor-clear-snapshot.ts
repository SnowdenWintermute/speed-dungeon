import { CombatantId, LadderCharacterFloorClearRecordId } from "../../aliases.js";
import { SerializedCombatantWithPets } from "../../servers/services/user-game-data-persistence/serialized-combatant-with-pets.js";

export interface CharacterFloorClearSnapshotView {
  id: LadderCharacterFloorClearRecordId;
  characterRecordId: CombatantId;
  characterName: string;
  combatantSchemaVersion: string;
  combatantWithPets: SerializedCombatantWithPets;
}
