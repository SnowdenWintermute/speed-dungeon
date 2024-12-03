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
  Item,
  Combatant,
  iterateNumericEnum,
  EquipmentType,
  OneHandedMeleeWeapon,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import createStartingEquipment from "./create-starting-equipment.js";
import { idGenerator } from "../../singletons.js";
import { generateOneOfEachItem, generateSpecificEquipmentType } from "./generate-test-items.js";

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

  const hpInjectors = new Array(1)
    .fill(null)
    .map(() => Item.createConsumable(idGenerator.generate(), ConsumableType.HpAutoinjector));
  const mpInjector = Item.createConsumable(idGenerator.generate(), ConsumableType.MpAutoinjector);
  combatantProperties.inventory.items.push(...hpInjectors);
  combatantProperties.inventory.items.push(mpInjector);

  const startingEquipment = createStartingEquipment(combatantProperties.combatantClass);
  for (const [slotKey, item] of Object.entries(startingEquipment)) {
    const slot = parseInt(slotKey) as EquipmentSlot;
    combatantProperties.equipment[slot] = item;
  }

  // FOR TESTING INVENTORY
  // generateTestItems(combatantProperties, 6);

  giveTestingCombatAttributes(combatantProperties);

  const items = generateOneOfEachItem();
  combatantProperties.inventory.items.push(...items);
  const runeSwords = (() => {
    const swords: Item[] = [];
    for (let i = 0; i < 10; i += 1) {
      const sword = generateSpecificEquipmentType({
        equipmentType: EquipmentType.OneHandedMeleeWeapon,
        baseItemType: OneHandedMeleeWeapon.RuneSword,
      });
      if (sword instanceof Item) swords.push(sword);
    }
    return swords;
  })();
  combatantProperties.inventory.items.push(...runeSwords);

  combatantProperties.unspentAttributePoints = 100;

  // for (const baseWeapon of iterateNumericEnum(Shield)) {
  //   const item = generateSpecificEquipmentType({
  //     equipmentType: EquipmentType.Shield,
  //     baseItemType: baseWeapon,
  //   });
  //   if (item instanceof Error || item === undefined) {
  //     console.error("forced item type not generated:", item);
  //     continue;
  //   }
  //   combatantProperties.inventory.items.push(item);
  // }

  // FOR TESTING ATTRIBUTE ASSIGNMENT
  // combatantProperties.unspentAttributePoints = 3;

  CombatantProperties.setHpAndMpToMax(combatantProperties);
}

function giveTestingCombatAttributes(combatantProperties: CombatantProperties) {
  for (const attribute of iterateNumericEnum(CombatAttribute)) {
    combatantProperties.inherentAttributes[attribute] = 100;
  }
}
