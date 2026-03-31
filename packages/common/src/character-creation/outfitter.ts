import cloneDeep from "lodash.clonedeep";
import { giveStartingAbilities } from "./give-starting-abilities.js";
import { giveStartingEquipment } from "./give-starting-equipment.js";
import { setPlaytestingCombatantProperties } from "./set-playtesting-combatant-properties.js";
import { givePlaytestingItems } from "./give-playtesting-items.js";
import { BASE_STARTING_ATTRIBUTES } from "../combatants/combatant-class/level-zero-attributes.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { STARTING_COMBATANT_TRAITS } from "../combatants/combatant-class/starting-traits.js";
import { CombatantTraitType } from "../combatants/combatant-traits/trait-types.js";
import { ItemGenerator } from "../items/item-creation/index.js";
import { Combatant } from "../combatants/index.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { HoldableHotswapSlot } from "../combatants/combatant-equipment/holdable-hotswap-slot.js";

export class CharacterOutfitter {
  constructor(private itemGenerator: ItemGenerator) {}

  outfitNewCharacter(character: Combatant) {
    const combatantProperties = character.combatantProperties;
    CharacterOutfitter.setPlaytestingCombatantProperties(combatantProperties);
    CharacterOutfitter.givePlaytestingItems(combatantProperties, this.itemGenerator);

    CharacterOutfitter.giveStartingAbilities(character);
    CharacterOutfitter.setUpInherentTraits(combatantProperties);
    this.giveStartingInventoryItems(combatantProperties);
    CharacterOutfitter.giveStartingEquipment(combatantProperties, this.itemGenerator);
    combatantProperties.resources.setToMax();
  }

  static giveStartingAbilities = giveStartingAbilities;
  static giveStartingEquipment = giveStartingEquipment;
  static setPlaytestingCombatantProperties = setPlaytestingCombatantProperties;
  static givePlaytestingItems = givePlaytestingItems;

  static setUpInherentTraits(combatantProperties: CombatantProperties) {
    const { combatantClass } = combatantProperties.classProgressionProperties.getMainClass();
    const classTraits = STARTING_COMBATANT_TRAITS[combatantClass];
    const traitProperties = combatantProperties.abilityProperties.getTraitProperties();
    traitProperties.inherentTraitLevels = cloneDeep(classTraits);

    // this is a one-off. as far as I know, no other traits have anything so special as to
    // require anything other than an arbitrary number to represent either a value or the level
    // of the trait which would be used in calculations scattered accross the codebase
    const hasExtraHoldableSlotTrait = !!classTraits[CombatantTraitType.ExtraHotswapSlot];
    if (!hasExtraHoldableSlotTrait) return;

    combatantProperties.equipment.addHoldableSlot(new HoldableHotswapSlot());
  }

  giveStartingInventoryItems(combatantProperties: CombatantProperties) {
    const hpInjectorCount = 2;
    const mpInjectorCount = 3;
    const injectors = [];
    for (let i = 0; i < hpInjectorCount; i += 1)
      injectors.push(this.itemGenerator.createConsumableByType(ConsumableType.HpAutoinjector));
    for (let i = 0; i < mpInjectorCount; i += 1)
      injectors.push(this.itemGenerator.createConsumableByType(ConsumableType.MpAutoinjector));

    const { inventory } = combatantProperties;
    inventory.consumables.push(...injectors);
  }
}
