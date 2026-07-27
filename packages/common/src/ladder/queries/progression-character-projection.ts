import { Username } from "../../aliases.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { Combatant } from "../../combatants/index.js";
import { SerializedOf } from "../../serialization/index.js";
import { SerializedPlayerCharacter } from "../../servers/services/user-game-data-persistence/serialized-player-character.js";
import { ProgressionCharacterView } from "./progression-character.js";

export function projectProgressionCharacterView(
  character: SerializedPlayerCharacter,
  ownerUsername: Username
): ProgressionCharacterView {
  return {
    ownerUsername,
    controlScheme: character.controlScheme,
    combatantWithPets: {
      combatant: {
        entityProperties: { id: character.id, name: character.name },
        combatantProperties: withoutInventoryItems(character.combatantProperties),
      },
      pets: character.pets.map(withoutPetInventoryItems),
    },
  };
}

// the record is already serialized, so the items are dropped from that shape rather than by
// deserializing a whole combatant to call deleteAllItems on it. capacity and shards stay, as they do
// on a floor clear snapshot: they describe the character rather than what it happens to be carrying
function withoutInventoryItems(
  combatantProperties: SerializedOf<CombatantProperties>
): SerializedOf<CombatantProperties> {
  return {
    ...combatantProperties,
    inventory: { ...combatantProperties.inventory, consumables: [], equipment: [] },
  };
}

function withoutPetInventoryItems(pet: SerializedOf<Combatant>): SerializedOf<Combatant> {
  return { ...pet, combatantProperties: withoutInventoryItems(pet.combatantProperties) };
}
