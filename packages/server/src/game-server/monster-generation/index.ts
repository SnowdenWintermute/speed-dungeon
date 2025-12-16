import { Vector3 } from "@babylonjs/core";
import { idGenerator, rngSingleton } from "../../singletons/index.js";
import getSpawnableMonsterTypesByFloor from "./get-spawnable-monster-types-by-floor.js";
import {
  AbilityType,
  AiType,
  CombatActionName,
  Combatant,
  CombatantClass,
  CombatantControlledBy,
  CombatantControllerType,
  Equipment,
  MONSTER_SPECIES,
  MONSTER_TYPE_STRINGS,
  MonsterType,
  getMonsterCombatantClass,
  randBetween,
} from "@speed-dungeon/common";
import { getMonsterEquipment } from "./get-monster-equipment.js";
import { ThreatManager } from "@speed-dungeon/common";
import { MONSTER_INHERENT_TRAIT_GETTERS } from "./monster-trait-getters.js";
import { CombatantProperties } from "@speed-dungeon/common";
// import { STOCK_MONSTER } from "../../index.js";
//
const EMPTY_STRING = "";

export function generateMonster(level: number, roomIndex: number, forcedType?: MonsterType) {
  // roll a random monster type from list of pre determined types
  // const spawnableTypes = getSpawnableMonsterTypesByFloor(level);
  //
  const spawnableTypes = roomIndex % 2 === 1 ? [MonsterType.MantaRay] : [MonsterType.Spider];

  const randomIndex = Math.floor(Math.floor(Math.random() * spawnableTypes.length));
  const monsterType = forcedType !== undefined ? forcedType : spawnableTypes[randomIndex]!;
  const combatantClass = getMonsterCombatantClass(monsterType);
  const combatantSpecies = MONSTER_SPECIES[monsterType];

  const entityProperties = {
    id: idGenerator.generate(
      `monster ${MONSTER_TYPE_STRINGS[monsterType]} on floor ${level} in room ${roomIndex}`
    ),
    name: MONSTER_TYPE_STRINGS[monsterType],
  };
  const combatantProperties = new CombatantProperties(
    combatantClass,
    combatantSpecies,
    monsterType,
    new CombatantControlledBy(CombatantControllerType.Dungeon, EMPTY_STRING),
    Vector3.Zero()
  );

  combatantProperties.classProgressionProperties.getMainClass().level = level;
  // combatantProperties.classProgressionProperties.getMainClass().level = 4;

  // // @TODO - remove, testing
  // const testLevel = randBetween(8, 9, rngSingleton);
  // combatantProperties.classProgressionProperties.getMainClass().level = testLevel;

  const ownedActions: CombatActionName[] = [
    CombatActionName.Attack,
    // CombatActionName.ChainingSplitArrowParent,
    // CombatActionName.ExplodingArrowParent,
    // CombatActionName.UseGreenAutoinjector,
    // CombatActionName.UseBlueAutoinjector,
    // CombatActionName.Blind,
    CombatActionName.Healing,
    // CombatActionName.PassTurn,
  ];

  // @TODO - assign abilities (realistically need to refactor monster creation)

  if (monsterType === MonsterType.Cultist) {
    ownedActions.push(...[CombatActionName.Fire, CombatActionName.IceBoltParent]);
    combatantProperties.controlledBy.setAiTypes([
      AiType.Healer,
      AiType.TargetTopOfThreatMeter,
      AiType.TargetLowestHpEnemy,
      AiType.RandomMaliciousAction,
    ]);
  }

  if (monsterType === MonsterType.MantaRay) {
    ownedActions.push(...[CombatActionName.IceBoltParent, CombatActionName.Healing]);

    combatantProperties.controlledBy.setAiTypes([
      AiType.Healer,
      AiType.PrefersAttackWithMana,
      AiType.TargetTopOfThreatMeter,
      AiType.TargetLowestHpEnemy,
      AiType.RandomMaliciousAction,
    ]);
  }

  if (monsterType === MonsterType.Spider) {
    ownedActions.push(...[CombatActionName.Ensnare]);

    combatantProperties.controlledBy.setAiTypes([
      AiType.PrefersAttackWithMana,
      AiType.TargetTopOfThreatMeter,
      AiType.TargetLowestHpEnemy,
      AiType.RandomMaliciousAction,
    ]);
  }

  if (monsterType === MonsterType.Wolf) {
    combatantProperties.controlledBy.setAiTypes([
      AiType.TargetTopOfThreatMeter,
      AiType.TargetLowestHpEnemy,
      AiType.RandomMaliciousAction,
    ]);
  }

  for (const actionName of ownedActions) {
    combatantProperties.abilityProperties.changeUnspentAbilityPoints(1);
    combatantProperties.abilityProperties.allocateAbilityPoint({
      type: AbilityType.Action,
      actionName,
    });
  }

  // const entityProperties = { id: idGenerator.generate(), name: STOCK_MONSTER.name };
  // const combatantProperties = cloneDeep(STOCK_MONSTER.combatantProperties);

  // equip weapons (do this before initialization because equipment needs to get its combatantProperties
  // reference set by the initialization)
  combatantProperties.equipment = getMonsterEquipment(monsterType);
  // will modify this monster after creation with basic values
  const monster = Combatant.createInitialized(entityProperties, combatantProperties);
  combatantProperties.threatManager = new ThreatManager();

  // randomize their hp a little
  // const baseHp = combatantProperties.inherentAttributes[CombatAttribute.Hp] || 1;
  // const randomNumberNormalDistribution = randomNormal();
  // const modifiedHp = baseHp * (randomNumberNormalDistribution + 0.5);
  // monster.combatantProperties.inherentAttributes[CombatAttribute.Hp] = Math.floor(modifiedHp);

  // @PERF - make a lookup table for inherent monster type traits
  // traits
  combatantProperties.abilityProperties.getTraitProperties().inherentTraitLevels =
    MONSTER_INHERENT_TRAIT_GETTERS[monsterType](level);

  // set hp and mp to max
  monster.combatantProperties.resources.setToMax();

  monster.combatantProperties.abilityProperties.applyConditionsFromTraits(monster, idGenerator);

  return monster;
}

function setEquipmentDurability(equipment: Equipment, durability: number) {
  if (!equipment.durability) return;
  equipment.durability.current = durability;
}
