import { EntityName, Username } from "../aliases.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { Combatant } from "../combatants/index.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { Consumable } from "../items/consumables/index.js";
import { TwoHandedRangedWeapon } from "../items/equipment/equipment-types/two-handed-ranged-weapon.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { Shield } from "../items/equipment/equipment-types/shield.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { STARTING_COMBATANT_TRAITS } from "../combatants/combatant-class/starting-traits.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { getPlayerCharacterStartingActions } from "../combatants/combatant-class/starting-owned-actions.js";

export type CharacterCreationPolicyConstructor = new (
  idGenerator: IdGenerator,
  itemBuilder: ItemBuilder
) => CharacterCreationPolicy;

const HP_INJECTOR_COUNT = 2;
const MP_INJECTOR_COUNT = 3;

export abstract class CharacterCreationPolicy {
  constructor(
    protected readonly idGenerator: IdGenerator,
    protected readonly itemBuilder: ItemBuilder
  ) {}

  abstract setCharacters(characters: Partial<Record<CombatantClass, Combatant[]>>): void;
  abstract createCharacter(
    name: EntityName,
    combatantClass: CombatantClass,
    controllingPlayerName: Username
  ): Combatant;
}

class DefaultCharacterCreationPolicy extends CharacterCreationPolicy {
  override setCharacters() {
    throw new Error("DefaultCharacterCreationPolicy will set characters internally");
  }

  createCharacter(
    name: EntityName,
    combatantClass: CombatantClass,
    controllingPlayerName: Username
  ): Combatant {
    const builder = this.createWarrior(name, controllingPlayerName);

    this.appendStartingTraits(builder, combatantClass);
    this.appendStartingActions(builder, combatantClass);
    this.appendStartingConsumables(builder);

    return builder.build(this.idGenerator);
  }

  private createWarrior(name: EntityName, controllingPlayerName: Username) {
    const { itemBuilder, idGenerator } = this;
    const builder = CombatantBuilder.playerCharacter(CombatantClass.Warrior, controllingPlayerName)
      .name(name)
      .equipMainHand(
        itemBuilder.oneHandedMeleeWeapon(OneHandedMeleeWeapon.Stick).build(idGenerator)
      )
      .equipOffHand(itemBuilder.shield(Shield.PotLid).build(idGenerator));

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
