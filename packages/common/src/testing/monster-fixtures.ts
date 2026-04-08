import { AiType } from "../combat/ai-behavior/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { BASIC_AI_PRIORITY } from "../monsters/monster-combat-profiles.js";
import { MonsterType } from "../monsters/monster-types.js";

export const MONSTER_FIXTURES = {
  WOLF: () =>
    CombatantBuilder.monster(MonsterType.Wolf)
      .name("Test Wolf")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 50)
      .attribute(CombatAttribute.Strength, 10)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 1)
      .ownedAction(CombatActionName.Attack)
      .aiTypes([AiType.TargetLowestHpEnemy, AiType.RandomMaliciousAction])
      .withThreatManager(),
  SPIDER: () =>
    CombatantBuilder.monster(MonsterType.Spider)
      .name("Test Spider")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 12)
      .attribute(CombatAttribute.Mp, 2)
      .attribute(CombatAttribute.Strength, 10)
      .attribute(CombatAttribute.Dexterity, 10)
      .attribute(CombatAttribute.Accuracy, 100)
      .attribute(CombatAttribute.Speed, 1)
      .ownedAction(CombatActionName.Attack)
      // .ownedAction(CombatActionName.Ensnare, 3)
      .aiTypes([AiType.TargetLowestHpEnemy, AiType.RandomMaliciousAction])
      // .aiTypes([AiType.PrefersAttackWithMana, ...BASIC_AI_PRIORITY])
      .withThreatManager(),
};
