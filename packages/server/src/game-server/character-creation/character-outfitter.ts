import {
  BASE_STARTING_ATTRIBUTES,
  Combatant,
  CombatantProperties,
  CombatantTraitType,
  ConsumableType,
  HoldableHotswapSlot,
  STARTING_COMBATANT_TRAITS,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { giveStartingAbilities } from "./give-starting-abilities.js";
import cloneDeep from "lodash.clonedeep";
import { createConsumableByType } from "../item-generation/create-consumable-by-type.js";
import { giveStartingEquipment } from "./give-starting-equipment.js";
import { setPlaytestingCombatantProperties } from "./set-playtesting-combatant-properties.js";

export class CharacterOutfitter {
  constructor() {}

  static outfitNewCharacter(character: Combatant) {
    const combatantProperties = character.combatantProperties;
    CharacterOutfitter.giveStartingAbilities(combatantProperties);
    CharacterOutfitter.giveStartingAttributes(combatantProperties);
    CharacterOutfitter.setUpInherentTraits(combatantProperties);
    CharacterOutfitter.giveStartingInventoryItems(combatantProperties);
    CharacterOutfitter.giveStartingEquipment(combatantProperties);
    CombatantProperties.setHpAndMpToMax(combatantProperties);
    CharacterOutfitter.setPlaytestingCombatantProperties(combatantProperties);
  }

  static giveStartingAbilities = giveStartingAbilities;
  static giveStartingEquipment = giveStartingEquipment;
  static setPlaytestingCombatantProperties = setPlaytestingCombatantProperties;

  static giveStartingAttributes(combatantProperties: CombatantProperties) {
    const baseStartingAttributesOption =
      BASE_STARTING_ATTRIBUTES[combatantProperties.combatantClass];
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(baseStartingAttributesOption)) {
      combatantProperties.inherentAttributes[attribute] = value;
    }
  }

  static setUpInherentTraits(combatantProperties: CombatantProperties) {
    const classTraits = STARTING_COMBATANT_TRAITS[combatantProperties.combatantClass];
    const { traitProperties } = combatantProperties.abilityProperties;
    traitProperties.inherentTraitLevels = cloneDeep(classTraits);

    // this is a one-off. as far as I know, no other traits have anything so special as to
    // require anything other than an arbitrary number to represent either a value or the level
    // of the trait which would be used in calculations scattered accross the codebase
    const hasExtraHoldableSlotTrait = !!classTraits[CombatantTraitType.ExtraHotswapSlot];
    if (!hasExtraHoldableSlotTrait) return;
    const { inherentHoldableHotswapSlots } = combatantProperties.equipment;
    inherentHoldableHotswapSlots.push(new HoldableHotswapSlot());
  }

  static giveStartingInventoryItems(combatantProperties: CombatantProperties) {
    const hpInjectorCount = 1;
    const mpInjectorCount = 1;
    const injectors = [];
    for (let i = 0; i < hpInjectorCount; i += 1)
      injectors.push(createConsumableByType(ConsumableType.HpAutoinjector));
    for (let i = 0; i < mpInjectorCount; i += 1)
      injectors.push(createConsumableByType(ConsumableType.MpAutoinjector));

    const { inventory } = combatantProperties;
    inventory.consumables.push(...injectors);
  }
}
