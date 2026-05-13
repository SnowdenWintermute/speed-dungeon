import { EntityName, Username } from "../aliases.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../utility-classes/random-number-generation-policy.js";
import { RANDOM_CHARACTER_NAMES_FIRST } from "./random-character-names.js";

export type CharacterFactory = (
  controllingPlayerName: Username,
  characterName: EntityName,
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder
) => Combatant;

export type CombatantFactory = (
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder,
  rngPolicy: RandomNumberGenerationPolicy,
  name?: EntityName | undefined
) => Combatant;

export type CharacterCreationPolicyConstructor = new (
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder,
  rngPolicy: RandomNumberGenerationPolicy
) => CharacterCreationPolicy;

export type FixedCharacterCreationLists = Partial<
  Record<CombatantClass, { characterFactory: CharacterFactory; petFactories: CombatantFactory[] }[]>
>;

export abstract class CharacterCreationPolicy {
  constructor(
    protected readonly idGenerator: IdGenerator,
    protected readonly itemBuilder: ItemBuilder,
    protected readonly rngPolicy: RandomNumberGenerationPolicy
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
  ): { character: Combatant; pets: Combatant[] };
}
