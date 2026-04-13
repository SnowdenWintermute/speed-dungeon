import { EntityName, Username } from "../aliases.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { Combatant } from "../combatants/index.js";
import { invariant } from "../utils/index.js";
import {
  CharacterCreationPolicy,
  FixedCharacterCreationLists,
} from "./character-creation-policy.js";

export class ScriptedCharacterCreationPolicy extends CharacterCreationPolicy {
  private lastCreatedIndicies: Record<CombatantClass, number> = {
    [CombatantClass.Warrior]: 0,
    [CombatantClass.Mage]: 0,
    [CombatantClass.Rogue]: 0,
  };
  private characterQueues: FixedCharacterCreationLists = {};

  override setCharacters(characters: FixedCharacterCreationLists) {
    this.characterQueues = characters;
  }

  createCharacter(
    name: EntityName,
    combatantClass: CombatantClass,
    controllingPlayerName: Username
  ): { character: Combatant; pets: Combatant[] } {
    const queue = this.characterQueues[combatantClass];
    if (!queue || queue.length === 0) {
      throw new Error(`No scripted character factory for class ${CombatantClass[combatantClass]}`);
    }

    const factoryIndex = this.lastCreatedIndicies[combatantClass];
    const factories = queue[factoryIndex];
    invariant(factories !== undefined, "factories not found in ScriptedCharacterCreationPolicy");
    const { characterFactory, petFactories } = factories;
    this.lastCreatedIndicies[combatantClass] = (factoryIndex + 1) % queue.length;

    invariant(
      factories !== undefined,
      `No scripted character factory for class ${CombatantClass[combatantClass]}`
    );

    if (!name) {
      name = this.generateRandomCharacterName();
    }

    const pets: Combatant[] = [];
    for (const petFactory of petFactories) {
      const pet = petFactory(this.idGenerator, this.itemBuilder, this.rngPolicy);
      pets.push(pet);
    }

    return {
      character: characterFactory(controllingPlayerName, name, this.idGenerator, this.itemBuilder),
      pets,
    };
  }
}
