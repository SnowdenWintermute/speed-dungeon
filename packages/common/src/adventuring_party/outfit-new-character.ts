import { CombatAttribute } from "../combatants";
import { BASE_STARTING_ATTRIBUTES } from "../combatants/combatant-classes/level-zero-attributes";
import { IdGenerator } from "../game/id_generator";
import { PlayerCharacter } from "./player-character";

export default function outfitNewCharacter(idGenerator: IdGenerator, character: PlayerCharacter) {
  const combatantProperties = character.combatantProperties;
  const baseStartingAttributesOption = BASE_STARTING_ATTRIBUTES[combatantProperties.combatantClass];
  if (baseStartingAttributesOption) {
    for (const [attributeKey, value] of Object.entries(baseStartingAttributesOption)) {
      const attribute = parseInt(attributeKey) as CombatAttribute;
      combatantProperties.inherentAttributes[attribute] = value;
    }
  }

  combatantProperties.setHpAndMpToMax();
}
