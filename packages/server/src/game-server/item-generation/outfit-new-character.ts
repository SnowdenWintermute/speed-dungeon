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
  iterateNumericEnumKeyedRecord,
  CombatantTraitType,
  HoldableHotswapSlot,
  CombatantTrait,
  EquipmentType,
  HoldableSlotType,
  Ring,
  WearableSlotType,
  Amulet,
  Equipment,
  TwoHandedRangedWeapon,
  MaxAndCurrent,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import createStartingEquipment, { givePlaytestingItems } from "./create-starting-equipment.js";
import { createConsumableByType } from "./create-consumable-by-type.js";
import { generateOneOfEachItem, generateSpecificEquipmentType } from "./generate-test-items.js";

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

  if (combatantProperties.combatantClass === CombatantClass.Rogue) outfitRogue(combatantProperties);
  if (combatantProperties.combatantClass === CombatantClass.Mage) outfitMage(combatantProperties);
  if (combatantProperties.combatantClass === CombatantClass.Warrior)
    outfitWarrior(combatantProperties);

  combatantProperties.abilities[AbilityName.Fire] = CombatantAbility.createByName(AbilityName.Fire);
  combatantProperties.abilities[AbilityName.Healing] = CombatantAbility.createByName(
    AbilityName.Healing
  );

  const hpInjectors = new Array(1)
    .fill(null)
    .map(() => createConsumableByType(ConsumableType.HpAutoinjector));
  // const mpInjector = Item.createConsumable(idGenerator.generate(), ConsumableType.MpAutoinjector);
  combatantProperties.inventory.consumables.push(...hpInjectors);
  combatantProperties.inventory.consumables.push(
    createConsumableByType(ConsumableType.MpAutoinjector)
  );

  const maybeError = createStartingEquipment(combatantProperties);
  if (maybeError instanceof Error) return maybeError;

  setExperimentalCombatantProperties(combatantProperties);

  CombatantProperties.setHpAndMpToMax(combatantProperties);
}

function outfitRogue(combatantProperties: CombatantProperties) {
  combatantProperties.traits.push({ type: CombatantTraitType.CanConvertToShardsManually });

  // const mh = generateSpecificEquipmentType({
  //   equipmentType: EquipmentType.OneHandedMeleeWeapon,
  //   baseItemType: OneHandedMeleeWeapon.BroadSword,
  // });
}

function outfitMage(combatantProperties: CombatantProperties) {
  // SPELLS
  combatantProperties.abilities[AbilityName.Ice] = CombatantAbility.createByName(AbilityName.Ice);
  // TRAITS
  combatantProperties.traits.push({
    type: CombatantTraitType.ExtraConsumablesStorage,
    capacity: 20,
  });
}

function outfitWarrior(combatantProperties: CombatantProperties) {
  const extraSlotTrait: CombatantTrait = {
    type: CombatantTraitType.ExtraHotswapSlot,
    hotswapSlot: new HoldableHotswapSlot(),
  };
  combatantProperties.traits.push(extraSlotTrait);

  // if (!(oh instanceof Error)) extraSlotTrait.hotswapSlot.holdables[HoldableSlotType.OffHand] = oh;
}

function giveHotswapSlotEquipment(combatantProperties: CombatantProperties) {
  const mh = generateSpecificEquipmentType({
    equipmentType: EquipmentType.TwoHandedRangedWeapon,
    baseItemType: TwoHandedRangedWeapon.ShortBow,
  });
  if (!(mh instanceof Error)) {
    if (combatantProperties.equipment.inherentHoldableHotswapSlots[1])
      combatantProperties.equipment.inherentHoldableHotswapSlots[1].holdables[
        HoldableSlotType.MainHand
      ] = mh;
    mh.durability = { inherentMax: 4, current: 1 };
  }

  // const oh = generateSpecificEquipmentType({
  //   equipmentType: EquipmentType.Shield,
  //   baseItemType: Shield.CabinetDoor,
  // });
  // if (!(oh instanceof Error))
  //   if (combatantProperties.equipment.inherentHoldableHotswapSlots[1])
  //     combatantProperties.equipment.inherentHoldableHotswapSlots[1].holdables[
  //       HoldableSlotType.OffHand
  //     ] = oh;
}

function setExperimentalCombatantProperties(combatantProperties: CombatantProperties) {
  giveHotswapSlotEquipment(combatantProperties);
  givePlaytestingItems(combatantProperties.equipment);
  // const items = generateOneOfEachItem();
  // combatantProperties.inventory.equipment.push(...(items as Equipment[]));

  // giveTestingCombatAttributes(combatantProperties);
  // combatantProperties.level = 5;
  combatantProperties.abilities[AbilityName.Destruction] = CombatantAbility.createByName(
    AbilityName.Destruction
  );
  combatantProperties.unspentAttributePoints = 100;
  combatantProperties.inherentAttributes[CombatAttribute.Speed] = 3;
  combatantProperties.inherentAttributes[CombatAttribute.Dexterity] = 3;
  // combatantProperties.inherentAttributes[CombatAttribute.Strength] = 100;
  // combatantProperties.inherentAttributes[CombatAttribute.Intelligence] = 100;
  // combatantProperties.inherentAttributes[CombatAttribute.Hp] = 1000;
  // FOR TESTING ATTRIBUTE ASSIGNMENT
  // combatantProperties.unspentAttributePoints = 3;
  combatantProperties.inventory.shards = 9999;
  // combatantProperties.inventory.equipment.push(HP_ARMOR_TEST_ITEM);
  // const equippedHoldableHotswapSlot =
  //   CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  // if (!equippedHoldableHotswapSlot)
  //   return new Error(ERROR_MESSAGES.EQUIPMENT.NO_SELECTED_HOTSWAP_SLOT);
  // equippedHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = WEAPON_TEST_ITEM;
  // TESTING
  // combatantProperties.hitPoints = Math.floor(combatantProperties.hitPoints * 0.5);
}
