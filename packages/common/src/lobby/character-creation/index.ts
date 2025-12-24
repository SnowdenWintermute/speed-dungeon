import { Combatant } from "../../combatants/index.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import {
  CombatantControlledBy,
  CombatantControllerType,
} from "../../combatants/combatant-controllers.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { CombatantSpecies } from "../../combatants/combatant-species.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { RANDOM_CHARACTER_NAMES_FIRST } from "./random-character-names.js";
import { Vector3 } from "@babylonjs/core";
import { CharacterOutfitter } from "./outfitter.js";
import { ItemGenerator } from "../../items/item-creation/index.js";

export class CharacterCreator {
  private characterOutfitter: CharacterOutfitter;
  constructor(
    private idGenerator: IdGenerator,
    itemGenerator: ItemGenerator
  ) {
    this.characterOutfitter = new CharacterOutfitter(itemGenerator);
  }

  generateRandomCharacterName() {
    return RANDOM_CHARACTER_NAMES_FIRST[
      Math.floor(Math.random() * RANDOM_CHARACTER_NAMES_FIRST.length)
    ]!;
  }

  createCharacter(name: string, combatantClass: CombatantClass, controllingPlayerName: string) {
    const characterId = this.idGenerator.generate(`player controlled character: ${name}`);

    if (name === "") {
      name = this.generateRandomCharacterName();
    }

    const entityProperties = { id: characterId, name };
    const combatantProperties = new CombatantProperties(
      combatantClass,
      CombatantSpecies.Humanoid,
      null,
      new CombatantControlledBy(CombatantControllerType.Player, controllingPlayerName),
      Vector3.Zero()
    );

    const newCharacter = Combatant.createInitialized(entityProperties, combatantProperties);

    this.characterOutfitter.outfitNewCharacter(newCharacter);

    return newCharacter;
  }
}
