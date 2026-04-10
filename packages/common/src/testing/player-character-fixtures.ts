import { EntityName, Username } from "../aliases.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { ConsumableType } from "../items/consumables/consumable-types.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "../items/equipment/equipment-types/two-handed-ranged-weapon.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";

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
      .attribute(CombatAttribute.Speed, 2)
      .ownedAction(CombatActionName.Attack)
      .ownedAction(CombatActionName.PassTurn)
      .ownedAction(CombatActionName.UseGreenAutoinjector)
      .ownedAction(CombatActionName.IceBoltParent)
      .ownedAction(CombatActionName.ChainingSplitArrowParent)
      .ownedAction(CombatActionName.Fire, 3)
      .ownedAction(CombatActionName.Firewall, 3)
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
      .attribute(CombatAttribute.Speed, 3)
      .ownedAction(CombatActionName.Attack)
      .ownedAction(CombatActionName.PassTurn)
      .ownedAction(CombatActionName.UseGreenAutoinjector)
      .ownedAction(CombatActionName.IceBoltParent)
      .ownedAction(CombatActionName.ChainingSplitArrowParent)
      .ownedAction(CombatActionName.Fire, 3)
      .ownedAction(CombatActionName.Firewall, 3)
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
      .attribute(CombatAttribute.Speed, 2)
      .ownedAction(CombatActionName.Attack)
      .ownedAction(CombatActionName.PassTurn)
      .addInventoryConsumable(
        itemBuilder.consumable(ConsumableType.HpAutoinjector).build(idGenerator)
      )
      .build(idGenerator),
};

export const BASIC_CHARACTER_FIXTURES = {
  [CombatantClass.Warrior]: [PLAYER_CHARACTER_FIXTURES.WARRIOR],
  [CombatantClass.Rogue]: [PLAYER_CHARACTER_FIXTURES.ROGUE],
  [CombatantClass.Mage]: [PLAYER_CHARACTER_FIXTURES.MAGE],
};
