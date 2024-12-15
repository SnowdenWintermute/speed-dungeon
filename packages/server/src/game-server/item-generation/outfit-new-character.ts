import {
  BASE_STARTING_ATTRIBUTES,
  STARTING_COMBATANT_TRAITS,
  CombatAttribute,
  CombatantAbility,
  AbilityName,
  CombatantClass,
  CombatantProperties,
  ConsumableType,
  EquipmentSlot,
  Item,
  Combatant,
  iterateNumericEnum,
  EquipmentProperties,
  EquipmentType,
  BodyArmor,
  ArmorCategory,
  MaxAndCurrent,
  AffixType,
  SuffixType,
  PrefixType,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import createStartingEquipment from "./create-starting-equipment.js";
import { idGenerator } from "../../singletons.js";
import { generateOneOfEachItem, generateSpecificEquipmentType } from "./generate-test-items.js";
import { HP_ARMOR_TEST_ITEM, WEAPON_TEST_ITEM } from "./test-items.js";

export default function outfitNewCharacter(character: Combatant) {
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

  combatantProperties.abilities[AbilityName.Fire] = CombatantAbility.createByName(AbilityName.Fire);
  combatantProperties.abilities[AbilityName.Healing] = CombatantAbility.createByName(
    AbilityName.Healing
  );
  if (combatantProperties.combatantClass === CombatantClass.Mage)
    combatantProperties.abilities[AbilityName.Ice] = CombatantAbility.createByName(AbilityName.Ice);

  const hpInjectors = new Array(1)
    .fill(null)
    .map(() => Item.createConsumable(idGenerator.generate(), ConsumableType.HpAutoinjector));
  const mpInjector = Item.createConsumable(idGenerator.generate(), ConsumableType.MpAutoinjector);
  combatantProperties.inventory.items.push(...hpInjectors);
  combatantProperties.inventory.items.push(mpInjector);

  const startingEquipment = createStartingEquipment(combatantProperties.combatantClass);
  if (startingEquipment instanceof Error) return startingEquipment;

  for (const [slotKey, item] of Object.entries(startingEquipment)) {
    const slot = parseInt(slotKey) as EquipmentSlot;
    combatantProperties.equipment[slot] = item;
  }

  // FOR TESTING INVENTORY
  // generateTestItems(combatantProperties, 6);

  // giveTestingCombatAttributes(combatantProperties);
  // combatantProperties.level = 5;

  combatantProperties.abilities[AbilityName.Destruction] = CombatantAbility.createByName(
    AbilityName.Destruction
  );

  // const items = generateOneOfEachItem();
  // combatantProperties.inventory.items.push(...items);
  combatantProperties.unspentAttributePoints = 100;
  combatantProperties.inherentAttributes[CombatAttribute.Speed] = 0;
  combatantProperties.inherentAttributes[CombatAttribute.Dexterity] = 100;
  combatantProperties.inherentAttributes[CombatAttribute.Hp] = 100;

  // FOR TESTING ATTRIBUTE ASSIGNMENT
  // combatantProperties.unspentAttributePoints = 3;

  combatantProperties.inventory.items.push(HP_ARMOR_TEST_ITEM);
  combatantProperties.equipment[EquipmentSlot.MainHand] = WEAPON_TEST_ITEM;

  CombatantProperties.setHpAndMpToMax(combatantProperties);
  // TESTING
  // combatantProperties.hitPoints = Math.floor(combatantProperties.hitPoints * 0.5);
}

function giveTestingCombatAttributes(combatantProperties: CombatantProperties) {
  for (const attribute of iterateNumericEnum(CombatAttribute)) {
    combatantProperties.inherentAttributes[attribute] = 100;
  }
}
