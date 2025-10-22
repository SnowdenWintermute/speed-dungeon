import {
  Combatant,
  CombatantClass,
  CombatantControllerType,
  CombatantProperties,
  CombatantSpecies,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons/index.js";
import { generateRandomCharacterName } from "../../utils/index.js";
import { Vector3 } from "@babylonjs/core";
import { CharacterOutfitter } from "./character-outfitter.js";
import { ClassProgressionProperties, CombatantClassProperties } from "@speed-dungeon/common";

export function createCharacter(
  name: string,
  combatantClass: CombatantClass,
  controllingPlayerName: string
) {
  const characterId = idGenerator.generate();

  if (name === "") name = generateRandomCharacterName();

  const entityProperties = { id: characterId, name };
  const combatantProperties = new CombatantProperties(
    new ClassProgressionProperties(new CombatantClassProperties(1, combatantClass)),
    CombatantSpecies.Humanoid,
    null,
    { controllerType: CombatantControllerType.Player, controllerName: controllingPlayerName },
    Vector3.Zero()
  );

  const newCharacter = Combatant.createInitialized(entityProperties, combatantProperties);

  CharacterOutfitter.outfitNewCharacter(newCharacter);

  return newCharacter;
}
