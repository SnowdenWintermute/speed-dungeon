import {
  BASE_STARTING_ATTRIBUTES,
  STARTING_COMBATANT_TRAITS,
  CombatAttribute,
  CombatantClass,
  CombatantProperties,
  ConsumableType,
  Combatant,
  iterateNumericEnumKeyedRecord,
  CombatantTraitType,
  HoldableHotswapSlot,
  CombatantTrait,
  EquipmentType,
  HoldableSlotType,
  TwoHandedRangedWeapon,
  OneHandedMeleeWeapon,
  BodyArmor,
  CombatActionName,
  CombatantActionState,
  TwoHandedMeleeWeapon,
  Equipment,
  CombatantContext,
  MagicalElement,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import createStartingEquipment, { givePlaytestingItems } from "./create-starting-equipment.js";
import { createConsumableByType } from "./create-consumable-by-type.js";
import { generateOneOfEachItem, generateSpecificEquipmentType } from "./generate-test-items.js";
import { combatantHasRequiredAttributesToUseItem } from "@speed-dungeon/common/src/combatants/can-use-item.js";

export function outfitNewCharacter(character: Combatant) {
  const combatantProperties = character.combatantProperties;

  const ownedActions = [
    CombatActionName.Attack,
    CombatActionName.ChainingSplitArrowParent,
    CombatActionName.UseGreenAutoinjector,
    CombatActionName.UseBlueAutoinjector,
    CombatActionName.IceBoltParent,
    CombatActionName.Fire,
    CombatActionName.Healing,
    CombatActionName.PassTurn,
    CombatActionName.ExplodingArrowParent,
    CombatActionName.Blind,
  ];

  for (const actionName of ownedActions) {
    const action = new CombatantActionState(actionName);
    const levelTwoSpells = [CombatActionName.Fire, CombatActionName.Healing];
    if (levelTwoSpells.includes(actionName)) action.level = 2;
    combatantProperties.ownedActions[actionName] = action;
  }

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

  combatantProperties.hitPoints = Math.floor(combatantProperties.hitPoints * 0.5);
  combatantProperties.mana = Math.floor(combatantProperties.mana * 0.4);
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
  // const mh = generateSpecificEquipmentType({
  //   equipmentType: EquipmentType.TwoHandedMeleeWeapon,
  //   baseItemType: TwoHandedMeleeWeapon.BoStaff,
  // });
  // if (!(mh instanceof Error)) {
  //   if (combatantProperties.equipment.inherentHoldableHotswapSlots[1])
  //     combatantProperties.equipment.inherentHoldableHotswapSlots[1].holdables[
  //       HoldableSlotType.MainHand
  //     ] = mh;
  //   mh.durability = { inherentMax: 4, current: 1 };
  // }

  const mh = generateSpecificEquipmentType(
    {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: TwoHandedRangedWeapon.RecurveBow,
    },
    true
  );
  if (!(mh instanceof Error) && combatantProperties.equipment.inherentHoldableHotswapSlots[1])
    combatantProperties.equipment.inherentHoldableHotswapSlots[1].holdables[
      HoldableSlotType.MainHand
    ] = mh;
  // const oh = generateSpecificEquipmentType(
  //   {
  //     equipmentType: EquipmentType.OneHandedMeleeWeapon,
  //     baseItemType: OneHandedMeleeWeapon.ButterKnife,
  //   },
  //   true
  // );
  // if (!(oh instanceof Error) && combatantProperties.equipment.inherentHoldableHotswapSlots[1])
  //   combatantProperties.equipment.inherentHoldableHotswapSlots[1].holdables[
  //     HoldableSlotType.OffHand
  //   ] = oh;

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
  // for (let i = 0; i < 18; i += 1) {
  //   const eq = generateSpecificEquipmentType({
  //     equipmentType: EquipmentType.BodyArmor,
  //     baseItemType: BodyArmor.Rags,
  //   });
  //   if (!(eq instanceof Error)) combatantProperties.inventory.equipment.push(eq);
  // }

  giveHotswapSlotEquipment(combatantProperties);
  // givePlaytestingItems(combatantProperties.equipment);

  // const runeSword = generateSpecificEquipmentType({
  //   equipmentType: EquipmentType.OneHandedMeleeWeapon,
  //   baseItemType: OneHandedMeleeWeapon.RuneSword,
  // });
  // if (runeSword instanceof Error) return;
  // combatantProperties.inventory.equipment.push(runeSword);
  const items = generateOneOfEachItem();
  combatantProperties.inventory.equipment.push(...(items as Equipment[]));

  // giveTestingCombatAttributes(combatantProperties);
  // combatantProperties.level = 5;
  combatantProperties.unspentAttributePoints = 3;
  combatantProperties.inherentAttributes[CombatAttribute.Speed] = 9;
  combatantProperties.inherentAttributes[CombatAttribute.Dexterity] = 45;
  combatantProperties.inherentAttributes[CombatAttribute.Strength] = 40;
  combatantProperties.inherentAttributes[CombatAttribute.Intelligence] = 40;
  // combatantProperties.inherentAttributes[CombatAttribute.Speed] = 9999;
  combatantProperties.inherentAttributes[CombatAttribute.Hp] = 75;
  combatantProperties.traits.push({
    type: CombatantTraitType.ElementalAffinity,
    element: MagicalElement.Fire,
    percent: 150,
  });
  // FOR TESTING ATTRIBUTE ASSIGNMENT
  // combatantProperties.unspentAttributePoints = 3;
  // combatantProperties.inventory.shards = 9999;
  // combatantProperties.inventory.equipment.push(HP_ARMOR_TEST_ITEM);
  // const equippedHoldableHotswapSlot =
  //   CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  // if (!equippedHoldableHotswapSlot)
  //   return new Error(ERROR_MESSAGES.EQUIPMENT.NO_SELECTED_HOTSWAP_SLOT);
  // equippedHoldableHotswapSlot.holdables[HoldableSlotType.MainHand] = WEAPON_TEST_ITEM;
  // TESTING
  // combatantProperties.hitPoints = Math.floor(combatantProperties.hitPoints * 0.5);
}
