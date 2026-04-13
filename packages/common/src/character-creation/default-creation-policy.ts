import { EntityName, Username } from "../aliases.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { TwoHandedRangedWeapon } from "../items/equipment/equipment-types/two-handed-ranged-weapon.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { Shield } from "../items/equipment/equipment-types/shield.js";
import { STARTING_COMBATANT_TRAITS } from "../combatants/combatant-class/starting-traits.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { getPlayerCharacterStartingActions } from "../combatants/combatant-class/starting-owned-actions.js";
import { TwoHandedMeleeWeapon } from "../items/equipment/equipment-types/two-handed-melee-weapon.js";
import { CharacterCreationPolicy } from "./character-creation-policy.js";
import { setPlaytestingCombatantProperties } from "./set-playtesting-combatant-properties.js";
import { givePlaytestingItems } from "./give-playtesting-items.js";

const HP_INJECTOR_COUNT = 2;
const MP_INJECTOR_COUNT = 3;

export class DefaultCharacterCreationPolicy extends CharacterCreationPolicy {
  override setCharacters() {
    throw new Error("DefaultCharacterCreationPolicy will set characters internally");
  }

  override createCharacter(
    name: EntityName,
    combatantClass: CombatantClass,
    controllingPlayerName: Username
  ) {
    if (name === ("" as EntityName)) {
      name = this.generateRandomCharacterName();
    }

    const builder = CombatantBuilder.playerCharacter(combatantClass, controllingPlayerName).name(
      name
    );

    this.appendStartingTraits(builder, combatantClass);
    this.appendStartingActions(builder, combatantClass);
    this.appendStartingEquipment(combatantClass, builder);
    this.appendStartingConsumables(builder);

    const result = builder.build(this.idGenerator);

    setPlaytestingCombatantProperties(result.combatantProperties);
    givePlaytestingItems(result.combatantProperties, this.idGenerator, this.itemBuilder);

    return { character: result, pets: [] };
  }

  private appendStartingEquipment(combatantClass: CombatantClass, builder: CombatantBuilder) {
    const { itemBuilder, idGenerator } = this;
    switch (combatantClass) {
      case CombatantClass.Warrior: {
        builder
          .equipMainHand(
            itemBuilder.oneHandedMeleeWeapon(OneHandedMeleeWeapon.Stick).build(idGenerator)
          )
          .equipOffHand(itemBuilder.shield(Shield.PotLid).build(idGenerator));
        break;
      }
      case CombatantClass.Mage: {
        builder.equipMainHand(
          itemBuilder.twoHandedMeleeWeapon(TwoHandedMeleeWeapon.RottingBranch).build(idGenerator)
        );
        break;
      }
      case CombatantClass.Rogue: {
        builder.equipMainHand(
          itemBuilder.twoHandedRangedWeapon(TwoHandedRangedWeapon.ShortBow).build(idGenerator)
        );
      }
    }

    return builder;
  }

  private appendStartingConsumables(builder: CombatantBuilder) {
    const { itemBuilder, idGenerator } = this;
    for (let i = 0; i < HP_INJECTOR_COUNT; i += 1) {
      builder.addInventoryConsumable(
        itemBuilder.consumable(ConsumableType.HpAutoinjector).build(idGenerator)
      );
    }
    for (let i = 0; i < MP_INJECTOR_COUNT; i += 1) {
      builder.addInventoryConsumable(
        itemBuilder.consumable(ConsumableType.MpAutoinjector).build(idGenerator)
      );
    }
  }

  private appendStartingTraits(builder: CombatantBuilder, combatantClass: CombatantClass) {
    const startingTraits = STARTING_COMBATANT_TRAITS[combatantClass];
    for (const [traitType, rank] of iterateNumericEnumKeyedRecord(startingTraits)) {
      builder.trait(traitType, rank);
    }
  }

  private appendStartingActions(builder: CombatantBuilder, combatantClass: CombatantClass) {
    const startingTraits = getPlayerCharacterStartingActions(combatantClass);
    for (const [traitType, rank] of iterateNumericEnumKeyedRecord(startingTraits)) {
      builder.ownedAction(traitType, rank);
    }
  }
}
