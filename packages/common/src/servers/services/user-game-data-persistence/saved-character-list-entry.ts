import { Combatant } from "../../../combatants/index.js";
import { SerializedOf } from "../../../serialization/index.js";

export interface SavedCharacterListEntry {
  combatant: SerializedOf<Combatant>;
  pets: SerializedOf<Combatant>[];
}
