import {
  BASE_STARTING_ATTRIBUTES,
  STARTING_COMBATANT_TRAITS,
  CombatAttribute,
  CombatantAbility,
  CombatantAbilityName,
  CombatantClass,
  CombatantProperties,
  ConsumableType,
  EquipmentSlot,
  IdGenerator,
  Item,
  PlayerCharacter,
  randBetween,
  DEEPEST_FLOOR,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import createStartingEquipment from "./create-starting-equipment";
import { GameServer } from "..";

export default function outfitNewCharacter(
  gameServer: GameServer,
  idGenerator: IdGenerator,
  character: PlayerCharacter
) {
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

  const startingEquipment = createStartingEquipment(
    idGenerator,
    combatantProperties.combatantClass
  );
  for (const [slotKey, item] of Object.entries(startingEquipment)) {
    const slot = parseInt(slotKey) as EquipmentSlot;
    combatantProperties.equipment[slot] = item;
  }

  for (let i = 0; i < 100; i += 1) {
    const iLvl = randBetween(1, DEEPEST_FLOOR);
    const randomItem = gameServer.generateRandomItem(10, idGenerator);
    if (!(randomItem instanceof Error)) combatantProperties.inventory.items.push(randomItem);
  }

  CombatantProperties.setHpAndMpToMax(combatantProperties);
}
