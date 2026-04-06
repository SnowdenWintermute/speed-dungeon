import { EntityName, Username } from "../aliases.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RANDOM_CHARACTER_NAMES_FIRST } from "./random-character-names.js";

export type CharacterFactory = (
  controllingPlayerName: Username,
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder
) => Combatant;

export type CharacterCreationPolicyConstructor = new (
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder
) => CharacterCreationPolicy;

export type FixedCharacterCreationLists = Partial<Record<CombatantClass, CharacterFactory[]>>;

export abstract class CharacterCreationPolicy {
  constructor(
    protected readonly idGenerator: IdGenerator,
    protected readonly itemBuilder: ItemBuilder
  ) {}

  generateRandomCharacterName(): EntityName {
    const name =
      RANDOM_CHARACTER_NAMES_FIRST[Math.floor(Math.random() * RANDOM_CHARACTER_NAMES_FIRST.length)];
    if (name === undefined) {
      throw new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
    }
    return name as EntityName;
  }

  abstract setCharacters(characters: FixedCharacterCreationLists): void;
  abstract createCharacter(
    name: EntityName,
    combatantClass: CombatantClass,
    controllingPlayerName: Username
  ): Combatant;
}
