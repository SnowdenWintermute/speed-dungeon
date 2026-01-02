import { Vector3 } from "@babylonjs/core";
import { RANDOM_CHARACTER_NAMES_FIRST } from "./random-character-names.js";
import { Combatant } from "../combatants/index.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import {
  CombatantControlledBy,
  CombatantControllerType,
} from "../combatants/combatant-controllers.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";
import { CombatantSpecies } from "../combatants/combatant-species.js";
import { IdGenerator } from "../utility-classes/index.js";
import { CharacterOutfitter } from "./outfitter.js";
import { ItemGenerator } from "../items/item-creation/index.js";
import { EntityId, EntityName } from "../aliases.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export class CharacterCreator {
  private characterOutfitter: CharacterOutfitter;
  constructor(
    private idGenerator: IdGenerator,
    itemGenerator: ItemGenerator
  ) {
    this.characterOutfitter = new CharacterOutfitter(itemGenerator);
  }

  generateRandomCharacterName() {
    const name =
      RANDOM_CHARACTER_NAMES_FIRST[Math.floor(Math.random() * RANDOM_CHARACTER_NAMES_FIRST.length)];
    if (name === undefined) {
      throw new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
    }
    return name as EntityName;
  }

  createCharacter(name: EntityName, combatantClass: CombatantClass, controllingPlayerName: string) {
    const characterId = this.idGenerator.generate(
      `player controlled character: ${name}`
    ) as EntityId;

    if (name === "") {
      name = this.generateRandomCharacterName();
    }

    const entityProperties = { id: characterId as EntityId, name };
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
