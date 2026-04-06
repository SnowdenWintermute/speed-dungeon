import { Username } from "../aliases.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { OneHandedMeleeWeapon } from "../items/equipment/equipment-types/one-handed-melee-weapon.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";

export const PLAYER_CHARACTER_FIXTURES = {
  WARRIOR: (playerName: Username, idGenerator: IdGenerator, itemBuilder: ItemBuilder) =>
    CombatantBuilder.playerCharacter(CombatantClass.Warrior, playerName)
      .name("Test Warrior")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 100)
      .attribute(CombatAttribute.Mp, 30)
      .attribute(CombatAttribute.Strength, 20)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 2)
      .ownedAction(CombatActionName.Attack)
      .ownedAction(CombatActionName.Fire, 3)
      .equipMainHand(
        itemBuilder.oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSword).build(idGenerator)
      )
      .build(idGenerator),
  ROGUE: (playerName: Username, idGenerator: IdGenerator, itemBuilder: ItemBuilder) =>
    CombatantBuilder.playerCharacter(CombatantClass.Rogue, playerName)
      .name("Test Rogue")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 100)
      .attribute(CombatAttribute.Strength, 20)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 2)
      .ownedAction(CombatActionName.Attack)
      .build(idGenerator),
  MAGE: (playerName: Username, idGenerator: IdGenerator, itemBuilder: ItemBuilder) =>
    CombatantBuilder.playerCharacter(CombatantClass.Mage, playerName)
      .name("Test Mage")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 100)
      .attribute(CombatAttribute.Strength, 20)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 2)
      .ownedAction(CombatActionName.Attack)
      .build(idGenerator),
};

export const BASIC_CHARACTER_FIXTURES = {
  [CombatantClass.Warrior]: [PLAYER_CHARACTER_FIXTURES.WARRIOR],
  [CombatantClass.Rogue]: [PLAYER_CHARACTER_FIXTURES.ROGUE],
  [CombatantClass.Mage]: [PLAYER_CHARACTER_FIXTURES.MAGE],
};
