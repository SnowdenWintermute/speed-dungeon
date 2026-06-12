import { Combatant } from "../../../combatants/index.js";
import { SerializedOf } from "../../../serialization/index.js";

export interface SerializedCombatantWithPets {
  combatant: SerializedOf<Combatant>;
  pets: SerializedOf<Combatant>[];
}
