import { EntityName, Username } from "../aliases.js";
import { FixedCharacterCreationLists } from "../character-creation/character-creation-policy.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "../items/equipment/equipment-types/two-handed-ranged-weapon.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { MONSTER_FIXTURES } from "./monster-fixtures.js";

export const PLAYER_CHARACTER_FIXTURES = {
  WARRIOR: (
    playerName: Username,
    characterName: EntityName,
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder
  ) =>
    CombatantBuilder.playerCharacter(CombatantClass.Warrior, playerName)
      .name(characterName)
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 100)
      .attribute(CombatAttribute.Mp, 30)
      .attribute(CombatAttribute.Strength, 20)
      .attribute(CombatAttribute.Dexterity, 10)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 20)
      .appendAllActions()
      .equipMainHand(
        itemBuilder.oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSword).build(idGenerator)
      )
      .equipMainHand(
        itemBuilder.twoHandedRangedWeapon(TwoHandedRangedWeapon.ShortBow).build(idGenerator),
        1
      )
      .addInventoryConsumable(
        itemBuilder.consumable(ConsumableType.HpAutoinjector).build(idGenerator)
      )
      .build(idGenerator),
  ROGUE: (
    playerName: Username,
    characterName: EntityName,
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder
  ) =>
    CombatantBuilder.playerCharacter(CombatantClass.Rogue, playerName)
      .name(characterName)
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 80)
      .attribute(CombatAttribute.Mp, 35)
      .attribute(CombatAttribute.Strength, 10)
      .attribute(CombatAttribute.Dexterity, 20)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 30)
      .appendAllActions()
      .equipMainHand(
        itemBuilder.oneHandedMeleeWeapon(OneHandedMeleeWeapon.Dagger).build(idGenerator)
      )
      .equipMainHand(
        itemBuilder.twoHandedRangedWeapon(TwoHandedRangedWeapon.ShortBow).build(idGenerator),
        1
      )
      .addInventoryConsumable(
        itemBuilder.consumable(ConsumableType.HpAutoinjector).build(idGenerator)
      )
      .build(idGenerator),
  MAGE: (
    playerName: Username,
    characterName: EntityName,
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder
  ) =>
    CombatantBuilder.playerCharacter(CombatantClass.Mage, playerName)
      .name(characterName)
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 100)
      .attribute(CombatAttribute.Strength, 20)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 20)
      .appendAllActions()
      .addInventoryConsumable(
        itemBuilder.consumable(ConsumableType.HpAutoinjector).build(idGenerator)
      )
      .build(idGenerator),
};

export const BASIC_CHARACTER_FIXTURES: FixedCharacterCreationLists = {
  [CombatantClass.Warrior]: [
    { characterFactory: PLAYER_CHARACTER_FIXTURES.WARRIOR, petFactories: [] },
  ],
  [CombatantClass.Rogue]: [{ characterFactory: PLAYER_CHARACTER_FIXTURES.ROGUE, petFactories: [] }],
  [CombatantClass.Mage]: [{ characterFactory: PLAYER_CHARACTER_FIXTURES.MAGE, petFactories: [] }],
};

export const CHARARCTER_FIXTURES_WITH_PETS: FixedCharacterCreationLists = {
  [CombatantClass.Warrior]: [
    {
      characterFactory: PLAYER_CHARACTER_FIXTURES.WARRIOR,
      petFactories: [
        (idGenerator, itemBuilder, rngPolicy, name) =>
          MONSTER_FIXTURES.WOLF(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
      ],
    },
  ],
  [CombatantClass.Rogue]: [
    {
      characterFactory: PLAYER_CHARACTER_FIXTURES.ROGUE,
      petFactories: [
        (idGenerator, itemBuilder, rngPolicy, name) =>
          MONSTER_FIXTURES.WOLF(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
      ],
    },
  ],
  [CombatantClass.Mage]: [
    {
      characterFactory: PLAYER_CHARACTER_FIXTURES.MAGE,
      petFactories: [
        (idGenerator, itemBuilder, rngPolicy, name) =>
          MONSTER_FIXTURES.WOLF(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
      ],
    },
  ],
};
