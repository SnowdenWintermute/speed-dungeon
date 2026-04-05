import { DungeonRoomType } from "../adventuring-party/dungeon-room.js";
import { Username } from "../aliases.js";
import { AiType } from "../combat/ai-behavior/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import {
  ExplicitCombatantDungeonTemplate,
  ExplicitCombatantRoomTemplate,
} from "../dungeon-generation/index.js";
import { MonsterType } from "../monsters/monster-types.js";
import { IdGenerator } from "../utility-classes/index.js";

const ROOM_WITH_TWO_WOLVES: ExplicitCombatantRoomTemplate = {
  type: DungeonRoomType.MonsterLair,
  combatants: [
    CombatantBuilder.monster(MonsterType.Wolf),
    CombatantBuilder.monster(MonsterType.Wolf),
  ],
};

const ROOM_WITH_TWO_SPIDERS: ExplicitCombatantRoomTemplate = {
  type: DungeonRoomType.MonsterLair,
  combatants: [
    CombatantBuilder.monster(MonsterType.Spider),
    CombatantBuilder.monster(MonsterType.Spider),
  ],
};

export const TEST_DUNGEON_TWO_SPIDER_ROOMS: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    ROOM_WITH_TWO_SPIDERS,
    ROOM_WITH_TWO_SPIDERS,
    {
      type: DungeonRoomType.Staircase,
    },
  ],
  [
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [CombatantBuilder.monster(MonsterType.Wolf)],
    },
  ],
];

export const TEST_DUNGEON_SIMPLE: ExplicitCombatantDungeonTemplate = [
  [
    {
      type: DungeonRoomType.Empty,
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [CombatantBuilder.monster(MonsterType.Wolf)],
    },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [CombatantBuilder.monster(MonsterType.Wolf)],
    },
    {
      type: DungeonRoomType.Staircase,
    },
  ],
  [
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [CombatantBuilder.monster(MonsterType.Wolf)],
    },
  ],
];

const WOLF_BUILDER = CombatantBuilder.monster(MonsterType.Wolf)
  .name("Test Wolf")
  .explicitAttributes()
  .attribute(CombatAttribute.Hp, 50)
  .attribute(CombatAttribute.Strength, 10)
  .attribute(CombatAttribute.Accuracy, 100)
  .attribute(CombatAttribute.Speed, 1)
  .ownedAction(CombatActionName.Attack)
  .aiTypes([AiType.TargetLowestHpEnemy, AiType.RandomMaliciousAction])
  .withThreatManager();

export const EXPLICIT_ATTACK_TEST_DUNGEON: ExplicitCombatantDungeonTemplate = [
  [
    { type: DungeonRoomType.Empty },
    {
      type: DungeonRoomType.MonsterLair,
      combatants: [WOLF_BUILDER],
    },
    { type: DungeonRoomType.Staircase },
  ],
];

export const createExplicitAttributesTestWarrior = (
  playerName: Username,
  idGenerator: IdGenerator
) =>
  CombatantBuilder.playerCharacter(CombatantClass.Warrior, playerName)
    .name("Test Warrior")
    .explicitAttributes()
    .attribute(CombatAttribute.Hp, 100)
    .attribute(CombatAttribute.Strength, 20)
    .attribute(CombatAttribute.Accuracy, 100)
    .attribute(CombatAttribute.Speed, 10)
    .ownedAction(CombatActionName.Attack)
    .build(idGenerator);
