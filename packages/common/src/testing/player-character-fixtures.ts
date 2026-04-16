import { EntityName, Username } from "../aliases.js";
import {
  CombatantFactory,
  FixedCharacterCreationLists,
} from "../character-creation/character-creation-policy.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "../items/equipment/equipment-types/two-handed-ranged-weapon.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { MONSTER_FIXTURES } from "./monster-fixtures.js";

export const BASIC_CHARACTER_FIXTURE_BUILDERS = {
  ROGUE: () =>
    CombatantBuilder.playerCharacter(CombatantClass.Rogue, "" as Username)
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 80)
      .attribute(CombatAttribute.Mp, 35)
      .attribute(CombatAttribute.Strength, 10)
      .attribute(CombatAttribute.Dexterity, 20)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 30)
      .unspentAbilityPoints(2)
      .appendAllActions(),
  WARRIOR: () =>
    CombatantBuilder.playerCharacter(CombatantClass.Warrior, "" as Username)
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 100)
      .attribute(CombatAttribute.Mp, 30)
      .attribute(CombatAttribute.Strength, 20)
      .attribute(CombatAttribute.Dexterity, 10)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 20)
      .unspentAbilityPoints(2)
      .appendAllActions(),
  MAGE: () =>
    CombatantBuilder.playerCharacter(CombatantClass.Mage, "" as Username)
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 100)
      .attribute(CombatAttribute.Strength, 20)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 20)
      .unspentAbilityPoints(2)
      .appendAllActions(),
};

export const PLAYER_CHARACTER_FIXTURES = {
  WARRIOR: (
    playerName: Username,
    characterName: EntityName,
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder
  ) =>
    BASIC_CHARACTER_FIXTURE_BUILDERS.WARRIOR()
      .name(characterName)
      .controllingPlayerName(playerName)
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
    BASIC_CHARACTER_FIXTURE_BUILDERS.ROGUE()
      .name(characterName)
      .controllingPlayerName(playerName)
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
    BASIC_CHARACTER_FIXTURE_BUILDERS.MAGE()
      .name(characterName)
      .controllingPlayerName(playerName)
      .addInventoryConsumable(
        itemBuilder.consumable(ConsumableType.HpAutoinjector).build(idGenerator)
      )
      .build(idGenerator),
};

export const HIGH_LEVEL_PLAYER_CHARACTER_FIXTURES = {
  WARRIOR: (
    playerName: Username,
    characterName: EntityName,
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder
  ) =>
    BASIC_CHARACTER_FIXTURE_BUILDERS.WARRIOR()
      .name(characterName)
      .controllingPlayerName(playerName)
      .level(10)
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
    BASIC_CHARACTER_FIXTURE_BUILDERS.ROGUE()
      .name(characterName)
      .controllingPlayerName(playerName)
      .level(10)
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
    BASIC_CHARACTER_FIXTURE_BUILDERS.MAGE()
      .name(characterName)
      .controllingPlayerName(playerName)
      .level(10)
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

export const CHARARCTER_FIXTURES_WITH_PET_MANTAS: FixedCharacterCreationLists = {
  [CombatantClass.Warrior]: [
    {
      characterFactory: PLAYER_CHARACTER_FIXTURES.WARRIOR,
      petFactories: [
        (idGenerator, itemBuilder, rngPolicy, name) =>
          MONSTER_FIXTURES.MANTA_RAY(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
      ],
    },
  ],
  [CombatantClass.Rogue]: [
    {
      characterFactory: PLAYER_CHARACTER_FIXTURES.ROGUE,
      petFactories: [
        (idGenerator, itemBuilder, rngPolicy, name) =>
          MONSTER_FIXTURES.MANTA_RAY(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
      ],
    },
  ],
  [CombatantClass.Mage]: [
    {
      characterFactory: PLAYER_CHARACTER_FIXTURES.MAGE,
      petFactories: [
        (idGenerator, itemBuilder, rngPolicy, name) =>
          MONSTER_FIXTURES.MANTA_RAY(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
      ],
    },
  ],
};

export const HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS: (
  petFactories: CombatantFactory[]
) => FixedCharacterCreationLists = (petFactories) => {
  return {
    [CombatantClass.Warrior]: [
      {
        characterFactory: HIGH_LEVEL_PLAYER_CHARACTER_FIXTURES.WARRIOR,
        petFactories,
      },
    ],
    [CombatantClass.Rogue]: [
      {
        characterFactory: HIGH_LEVEL_PLAYER_CHARACTER_FIXTURES.ROGUE,
        petFactories,
      },
    ],
    [CombatantClass.Mage]: [
      {
        characterFactory: HIGH_LEVEL_PLAYER_CHARACTER_FIXTURES.MAGE,
        petFactories,
      },
    ],
  };
};
