import { EntityName, Username } from "../aliases.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { Combatant } from "../combatants/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";

export type CharacterCreationPolicyConstructor = new (
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder
) => CharacterCreationPolicy;

export abstract class CharacterCreationPolicy {
  constructor(
    protected readonly idGenerator: IdGenerator,
    protected readonly itemBuilder: ItemBuilder
  ) {}

  abstract setCharacters(characters: Partial<Record<CombatantClass, Combatant[]>>): void;
  abstract createCharacter(
    name: EntityName,
    combatantClass: CombatantClass,
    controllingPlayerName: Username
  ): Combatant;
}
