import { EntityName, Username } from "../aliases.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { Combatant } from "../combatants/index.js";
import { invariant } from "../utils/index.js";
import { CharacterCreationPolicy, CharacterFactory } from "./character-creation-policy.js";

export class ScriptedCharacterCreationPolicy extends CharacterCreationPolicy {
  private lastCreatedIndicies: Record<CombatantClass, number> = {
    [CombatantClass.Warrior]: 0,
    [CombatantClass.Mage]: 0,
    [CombatantClass.Rogue]: 0,
  };
  private characterQueues: Partial<Record<CombatantClass, CharacterFactory[]>> = {};

  override setCharacters(characters: Partial<Record<CombatantClass, CharacterFactory[]>>) {
    this.characterQueues = characters;
  }

  createCharacter(
    _name: EntityName,
    combatantClass: CombatantClass,
    controllingPlayerName: Username
  ): Combatant {
    const queue = this.characterQueues[combatantClass];
    if (!queue || queue.length === 0) {
      throw new Error(`No scripted character factory for class ${CombatantClass[combatantClass]}`);
    }

    const factoryIndex = this.lastCreatedIndicies[combatantClass];
    const factory = queue[factoryIndex];
    this.lastCreatedIndicies[combatantClass] = (factoryIndex + 1) % queue.length;

    invariant(
      factory !== undefined,
      `No scripted character factory for class ${CombatantClass[combatantClass]}`
    );
    return factory(controllingPlayerName, this.idGenerator);
  }
}
