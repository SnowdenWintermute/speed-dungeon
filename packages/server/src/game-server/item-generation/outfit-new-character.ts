import {
  BASE_STARTING_ATTRIBUTES,
  STARTING_COMBATANT_TRAITS,
  CombatAttribute,
  CombatantAbility,
  AbilityName,
  CombatantClass,
  CombatantProperties,
  ConsumableType,
  Combatant,
  iterateNumericEnum,
  Consumable,
  formatConsumableType,
  ERROR_MESSAGES,
  HoldableSlotType,
  iterateNumericEnumKeyedRecord,
  EquipmentType,
  OneHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  TwoHandedMeleeWeapon,
  Inventory,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import createStartingEquipment from "./create-starting-equipment.js";
import { idGenerator } from "../../singletons.js";
import { HP_ARMOR_TEST_ITEM, WEAPON_TEST_ITEM } from "./test-items.js";
import { CombatantEquipment } from "@speed-dungeon/common";
import generateTestItems, { generateSpecificEquipmentType } from "./generate-test-items.js";

export default function outfitNewCharacter(character: Combatant) {
  const combatantProperties = character.combatantProperties;

  const baseStartingAttributesOption = BASE_STARTING_ATTRIBUTES[combatantProperties.combatantClass];
  if (baseStartingAttributesOption) {
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(baseStartingAttributesOption)) {
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
    .map(
      () =>
        new Consumable(
          { name: formatConsumableType(ConsumableType.HpAutoinjector), id: idGenerator.generate() },
          1,
          {},
          ConsumableType.HpAutoinjector,
          1
        )
    );
  // const mpInjector = Item.createConsumable(idGenerator.generate(), ConsumableType.MpAutoinjector);
  combatantProperties.inventory.consumables.push(...hpInjectors);
  combatantProperties.inventory.consumables.push(
    new Consumable(
      { name: formatConsumableType(ConsumableType.MpAutoinjector), id: idGenerator.generate() },
      1,
      {},
      ConsumableType.HpAutoinjector,
      1
    )
  );

  const maybeError = createStartingEquipment(combatantProperties);
  if (maybeError instanceof Error) return maybeError;

  // FOR TESTING INVENTORY
  // generateTestItems(combatantProperties, 6);
  const item1 = generateSpecificEquipmentType({
    equipmentType: EquipmentType.OneHandedMeleeWeapon,
    baseItemType: OneHandedMeleeWeapon.Club,
  });
  const item2 = generateSpecificEquipmentType({
    equipmentType: EquipmentType.TwoHandedMeleeWeapon,
    baseItemType: TwoHandedMeleeWeapon.RottingBranch,
  });
  if (item1 instanceof Error || item2 instanceof Error) return item1;
  Inventory.insertItem(combatantProperties.inventory, item1);
  Inventory.insertItem(combatantProperties.inventory, item2);

  // giveTestingCombatAttributes(combatantProperties);
  // combatantProperties.level = 5;

  combatantProperties.abilities[AbilityName.Destruction] = CombatantAbility.createByName(
    AbilityName.Destruction
  );

  // const items = generateOneOfEachItem();
  // combatantProperties.inventory.equipment.push(...items);
  combatantProperties.unspentAttributePoints = 100;
  combatantProperties.inherentAttributes[CombatAttribute.Speed] = 100;
  combatantProperties.inherentAttributes[CombatAttribute.Dexterity] = 100;
  combatantProperties.inherentAttributes[CombatAttribute.Hp] = 100;

  // FOR TESTING ATTRIBUTE ASSIGNMENT
  // combatantProperties.unspentAttributePoints = 3;

  combatantProperties.inventory.equipment.push(HP_ARMOR_TEST_ITEM);
  const equippedHoldableHotswapSlot =
    CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  if (!equippedHoldableHotswapSlot)
    return new Error(ERROR_MESSAGES.EQUIPMENT.NO_SELECTED_HOTSWAP_SLOT);
  // equippedHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = WEAPON_TEST_ITEM;

  CombatantProperties.setHpAndMpToMax(combatantProperties);

  // TESTING
  // combatantProperties.hitPoints = Math.floor(combatantProperties.hitPoints * 0.5);
}

function giveTestingCombatAttributes(combatantProperties: CombatantProperties) {
  for (const attribute of iterateNumericEnum(CombatAttribute)) {
    combatantProperties.inherentAttributes[attribute] = 100;
  }
}
