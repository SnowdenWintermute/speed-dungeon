import cloneDeep from "lodash.clonedeep";
import { giveStartingAbilities } from "./give-starting-abilities.js";
import { giveStartingEquipment } from "./give-starting-equipment.js";
import { setPlaytestingCombatantProperties } from "./set-playtesting-combatant-properties.js";
import { givePlaytestingItems } from "./give-playtesting-items.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";
import { STARTING_COMBATANT_TRAITS } from "../combatants/combatant-class/starting-traits.js";
import { CombatantTraitType } from "../combatants/combatant-traits/trait-types.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { Combatant } from "../combatants/index.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { HoldableHotswapSlot } from "../combatants/combatant-equipment/holdable-hotswap-slot.js";

export class CharacterOutfitter {
  constructor(
    private idGenerator: IdGenerator,
    private itemBuilder: ItemBuilder
  ) {}

  outfitNewCharacter(character: Combatant) {
    const combatantProperties = character.combatantProperties;
    CharacterOutfitter.setPlaytestingCombatantProperties(combatantProperties);
    this.givePlaytestingItems(combatantProperties);

    CharacterOutfitter.giveStartingAbilities(character);
    CharacterOutfitter.setUpInherentTraits(combatantProperties);
    this.giveStartingInventoryItems(combatantProperties);
    this.giveStartingEquipment(combatantProperties);
    combatantProperties.resources.setToMax();
  }

  static giveStartingAbilities = giveStartingAbilities;
  static setPlaytestingCombatantProperties = setPlaytestingCombatantProperties;

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

  giveStartingEquipment(combatantProperties: CombatantProperties) {
    giveStartingEquipment(combatantProperties, this.idGenerator, this.itemBuilder);
  }

  givePlaytestingItems(combatantProperties: CombatantProperties) {
    givePlaytestingItems(combatantProperties, this.idGenerator, this.itemBuilder);
  }

  giveStartingInventoryItems(combatantProperties: CombatantProperties) {
    const hpInjectorCount = 2;
    const mpInjectorCount = 3;
    const injectors = [];
    for (let i = 0; i < hpInjectorCount; i += 1)
      injectors.push(this.itemBuilder.consumable(ConsumableType.HpAutoinjector).build(this.idGenerator));
    for (let i = 0; i < mpInjectorCount; i += 1)
      injectors.push(this.itemBuilder.consumable(ConsumableType.MpAutoinjector).build(this.idGenerator));

    const { inventory } = combatantProperties;
    inventory.consumables.push(...injectors);
  }
}
