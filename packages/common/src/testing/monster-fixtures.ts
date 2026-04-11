import { AiType } from "../combat/ai-behavior/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { appendMonsterEquipment } from "../monsters/append-monster-equipment.js";
import { BASIC_AI_PRIORITY } from "../monsters/monster-combat-profiles.js";
import { MonsterType } from "../monsters/monster-types.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../utility-classes/random-number-generation-policy.js";

export const MONSTER_FIXTURES = {
  WOLF: (
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder,
    rngPolicy: RandomNumberGenerationPolicy
  ) => {
    const builder = CombatantBuilder.monster(MonsterType.Wolf)
      .name("Test Wolf")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 50)
      .attribute(CombatAttribute.Strength, 10)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 1)
      .ownedAction(CombatActionName.Attack)
      .aiTypes([...BASIC_AI_PRIORITY])
      .withThreatManager();

    appendMonsterEquipment(
      builder,
      MonsterType.Wolf,
      idGenerator,
      itemBuilder,
      rngPolicy.monsterEquipmentChoice
    );

    return builder;
  },
  SPIDER: (
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder,
    rngPolicy: RandomNumberGenerationPolicy
  ) => {
    const builder = CombatantBuilder.monster(MonsterType.Spider)
      .name("Test Spider")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 12)
      .attribute(CombatAttribute.Mp, 2)
      .attribute(CombatAttribute.Strength, 10)
      .attribute(CombatAttribute.Dexterity, 10)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 1)
      .ownedAction(CombatActionName.Attack)
      .ownedAction(CombatActionName.Ensnare, 3)
      // .aiTypes([AiType.TargetLowestHpEnemy, AiType.RandomMaliciousAction])
      .aiTypes([AiType.PrefersAttackWithMana, ...BASIC_AI_PRIORITY])
      .withThreatManager();

    appendMonsterEquipment(
      builder,
      MonsterType.Spider,
      idGenerator,
      itemBuilder,
      rngPolicy.monsterEquipmentChoice
    );

    return builder;
  },
  WOLF_ZERO_SPEED: () => {
    const builder = CombatantBuilder.monster(MonsterType.Wolf)
      .name("Test Wolf")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 1)
      .attribute(CombatAttribute.Speed, 0)
      .ownedAction(CombatActionName.Attack)
      .aiTypes([...BASIC_AI_PRIORITY])
      .withThreatManager();
    return builder;
  },
  WOLF_LOW_HP: (
    idGenerator: IdGenerator,
    itemBuilder: ItemBuilder,
    rngPolicy: RandomNumberGenerationPolicy
  ) => {
    const builder = CombatantBuilder.monster(MonsterType.Wolf)
      .name("Test Wolf")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 7)
      .attribute(CombatAttribute.Strength, 10)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 1)
      .ownedAction(CombatActionName.Attack)
      .aiTypes([AiType.TargetLowestHpEnemy, AiType.RandomMaliciousAction])
      .withThreatManager();

    appendMonsterEquipment(
      builder,
      MonsterType.Wolf,
      idGenerator,
      itemBuilder,
      rngPolicy.monsterEquipmentChoice
    );

    return builder;
  },
};
