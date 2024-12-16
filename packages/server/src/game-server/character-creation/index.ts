import {
  Combatant,
  CombatantClass,
  CombatantProperties,
  CombatantSpecies,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons.js";
import outfitNewCharacter from "../item-generation/outfit-new-character.js";
import { generateRandomCharacterName } from "../../utils/index.js";
import { Vector3 } from "@babylonjs/core";

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

  const result = outfitNewCharacter(newCharacter);
  if (result instanceof Error) return result;

  return newCharacter;
}
