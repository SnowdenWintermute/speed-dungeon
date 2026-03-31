import { RANDOM_CHARACTER_NAMES_FIRST } from "./random-character-names.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { IdGenerator } from "../utility-classes/index.js";
import { CharacterOutfitter } from "./outfitter.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { EntityName, Username } from "../aliases.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";

export class CharacterCreator {
  private characterOutfitter: CharacterOutfitter;
  constructor(
    private idGenerator: IdGenerator,
    itemBuilder: ItemBuilder
  ) {
    this.characterOutfitter = new CharacterOutfitter(idGenerator, itemBuilder);
  }

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

    const newCharacter = CombatantBuilder.playerCharacter(combatantClass, controllingPlayerName)
      .name(name)
      .build(this.idGenerator);

    this.characterOutfitter.outfitNewCharacter(newCharacter);

    return newCharacter;
  }
}
