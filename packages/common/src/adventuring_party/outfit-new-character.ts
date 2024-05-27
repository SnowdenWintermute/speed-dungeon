import cloneDeep from "lodash.clonedeep";
import {
  CombatAttribute,
  CombatantAbility,
  CombatantAbilityName,
  CombatantClass,
} from "../combatants";
import { BASE_STARTING_ATTRIBUTES } from "../combatants/combatant-classes/level-zero-attributes";
import { STARTING_COMBATANT_TRAITS } from "../combatants/combatant-classes/starting-traits";
import { IdGenerator } from "../game/id_generator";
import { PlayerCharacter } from "./player-character";
import { Item } from "../items";
import { ConsumableType } from "../items/consumables";

export default function outfitNewCharacter(idGenerator: IdGenerator, character: PlayerCharacter) {
  const combatantProperties = character.combatantProperties;
  const baseStartingAttributesOption = BASE_STARTING_ATTRIBUTES[combatantProperties.combatantClass];
  if (baseStartingAttributesOption) {
    for (const [attributeKey, value] of Object.entries(baseStartingAttributesOption)) {
      const attribute = parseInt(attributeKey) as CombatAttribute;
      combatantProperties.inherentAttributes[attribute] = value;
    }
  }

  const classTraitsOption = STARTING_COMBATANT_TRAITS[combatantProperties.combatantClass];
  if (classTraitsOption) combatantProperties.traits = cloneDeep(classTraitsOption);

  combatantProperties.abilities[CombatantAbilityName.Fire] = CombatantAbility.createByName(
    CombatantAbilityName.Fire
  );
  combatantProperties.abilities[CombatantAbilityName.Healing] = CombatantAbility.createByName(
    CombatantAbilityName.Healing
  );
  if (combatantProperties.combatantClass === CombatantClass.Mage)
    combatantProperties.abilities[CombatantAbilityName.Ice] = CombatantAbility.createByName(
      CombatantAbilityName.Ice
    );

  const hpInjector = Item.createConsumable(
    idGenerator.getNextEntityId(),
    ConsumableType.HpAutoinjector
  );
  const mpInjector = Item.createConsumable(
    idGenerator.getNextEntityId(),
    ConsumableType.MpAutoinjector
  );
  combatantProperties.inventory.items.push(hpInjector);
  combatantProperties.inventory.items.push(mpInjector);

  combatantProperties.setHpAndMpToMax();
}
