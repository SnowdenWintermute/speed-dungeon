import { RANDOM_CHARACTER_NAMES_FIRST } from "./random-character-names.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { EntityName, Username } from "../aliases.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { CharacterCreationPolicy } from "./character-creation-policy.js";

export class CharacterCreator {
  constructor(private creationPolicy: CharacterCreationPolicy) {}

  generateRandomCharacterName() {
    const name =
      RANDOM_CHARACTER_NAMES_FIRST[Math.floor(Math.random() * RANDOM_CHARACTER_NAMES_FIRST.length)];
    if (name === undefined) {
      throw new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
    }
    return name as EntityName;
  }

  createCharacter(
    name: EntityName,
    combatantClass: CombatantClass,
    controllingPlayerName: Username
  ) {
    if (name === "") {
      name = this.generateRandomCharacterName();
    }

    const newCharacter = this.creationPolicy.createCharacter(
      name,
      combatantClass,
      controllingPlayerName
    );

    return newCharacter;
  }
}
