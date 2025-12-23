import {
  Combatant,
  CombatantClass,
  CombatantControlledBy,
  CombatantControllerType,
  CombatantProperties,
  CombatantSpecies,
} from "@speed-dungeon/common";
import { getGameServer, idGenerator } from "../../singletons/index.js";
import { generateRandomCharacterName } from "../../utils/index.js";
import { Vector3 } from "@babylonjs/core";

export function createCharacter(
  name: string,
  combatantClass: CombatantClass,
  controllingPlayerName: string
) {
  const characterId = idGenerator.generate(`player controlled character: ${name}`);

  if (name === "") name = generateRandomCharacterName();

  const entityProperties = { id: characterId, name };
  const combatantProperties = new CombatantProperties(
    combatantClass,
    CombatantSpecies.Humanoid,
    null,
    new CombatantControlledBy(CombatantControllerType.Player, controllingPlayerName),
    Vector3.Zero()
  );

  const newCharacter = Combatant.createInitialized(entityProperties, combatantProperties);

  getGameServer().characterOutfitter.outfitNewCharacter(newCharacter);

  return newCharacter;
}
