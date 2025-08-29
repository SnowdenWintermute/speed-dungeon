import {
  Combatant,
  CombatantClass,
  CombatantProperties,
  CombatantSpecies,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons/index.js";
import { generateRandomCharacterName } from "../../utils/index.js";
import { Vector3 } from "@babylonjs/core";
import { CharacterOutfitter } from "./character-outfitter.js";

export function createCharacter(name: string, combatantClass: CombatantClass) {
  const characterId = idGenerator.generate();

  if (name === "") name = generateRandomCharacterName();

  const entityProperties = { id: characterId, name };
  const combatantProperties = new CombatantProperties(
    combatantClass,
    CombatantSpecies.Humanoid,
    null,
    "",
    Vector3.Zero()
  );

  const newCharacter = new Combatant(entityProperties, combatantProperties);

  CharacterOutfitter.outfitNewCharacter(newCharacter);

  return newCharacter;
}
