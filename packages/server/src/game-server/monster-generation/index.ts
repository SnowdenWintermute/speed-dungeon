import { Vector3 } from "@babylonjs/core";
import { idGenerator } from "../../singletons/index.js";
import getSpawnableMonsterTypesByFloor from "./get-spawnable-monster-types-by-floor.js";
import {
  AiType,
  CombatActionName,
  CombatAttribute,
  Combatant,
  CombatantActionState,
  CombatantProperties,
  Equipment,
  KineticDamageType,
  MONSTER_SPECIES,
  MONSTER_TYPE_STRINGS,
  MonsterType,
  getMonsterCombatantClass,
  iterateNumericEnumKeyedRecord,
  randomNormal,
} from "@speed-dungeon/common";
import { getMonsterStartingAttributes } from "./get-monster-starting-attributes.js";
import { addAttributesToAccumulator } from "@speed-dungeon/common";
import getMonsterPerLevelAttributes from "./get-monster-per-level-attributes.js";
import { getMonsterEquipment } from "./get-monster-equipment.js";
import { ThreatManager } from "@speed-dungeon/common";
import { MONSTER_INHERENT_TRAIT_GETTERS } from "./monster-trait-getters.js";
// import { STOCK_MONSTER } from "../../index.js";

export function generateMonster(level: number, forcedType?: MonsterType) {
  // roll a random monster type from list of pre determined types
  const spawnableTypes = getSpawnableMonsterTypesByFloor(level);
  const randomIndex = Math.floor(Math.floor(Math.random() * spawnableTypes.length));
  const monsterType = forcedType !== undefined ? forcedType : spawnableTypes[randomIndex]!;
  const combatantClass = getMonsterCombatantClass(monsterType);
  const combatantSpecies = MONSTER_SPECIES[monsterType];

  const entityProperties = {
    id: idGenerator.generate(),
    name: MONSTER_TYPE_STRINGS[monsterType],
  };
  const combatantProperties = new CombatantProperties(
    combatantClass,
    combatantSpecies,
    monsterType,
    null,
    Vector3.Zero()
  );

  const ownedActions: CombatActionName[] = [
    CombatActionName.Attack,
    // CombatActionName.Fire,
    // CombatActionName.IceBoltParent,
    // CombatActionName.ChainingSplitArrowParent,
    // CombatActionName.ExplodingArrowParent,
    // CombatActionName.UseGreenAutoinjector,
    // CombatActionName.UseBlueAutoinjector,
    // CombatActionName.Blind,
    CombatActionName.Healing,
    // CombatActionName.PassTurn,
  ];

  for (const actionName of ownedActions) {
    const action = new CombatantActionState(actionName);
    if (actionName === CombatActionName.Fire) action.level = 2;
    // if (actionName === CombatActionName.Healing) action.level = 1;
    combatantProperties.abilityProperties.ownedActions[actionName] = action;
  }

  // const entityProperties = { id: idGenerator.generate(), name: STOCK_MONSTER.name };
  // const combatantProperties = cloneDeep(STOCK_MONSTER.combatantProperties);

  // will modify this monster after creation with basic values
  const monster = new Combatant(entityProperties, combatantProperties);
  combatantProperties.threatManager = new ThreatManager();
  combatantProperties.level = level;
  // assign their "discretionary" attributes
  // assign attributes that would have come from wearing gear
  const startingAttributes = getMonsterStartingAttributes(monsterType);
  addAttributesToAccumulator(startingAttributes, combatantProperties.inherentAttributes);
  const attributesPerLevel = getMonsterPerLevelAttributes(monsterType);
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(attributesPerLevel)) {
    const levelAdjustedValue = value * (combatantProperties.level - 1);

    if (!combatantProperties.inherentAttributes[attribute])
      combatantProperties.inherentAttributes[attribute] = levelAdjustedValue;
    else combatantProperties.inherentAttributes[attribute]! += levelAdjustedValue;
  }
  // randomize their hp a little
  const baseHp = combatantProperties.inherentAttributes[CombatAttribute.Hp] || 1;
  const randomNumberNormalDistribution = randomNormal();
  const modifiedHp = baseHp * (randomNumberNormalDistribution + 0.5);
  monster.combatantProperties.inherentAttributes[CombatAttribute.Hp] = Math.floor(modifiedHp);

  // @PERF - make a lookup table for inherent monster type traits
  // traits
  combatantProperties.abilityProperties.traitProperties.inherentTraitLevels =
    MONSTER_INHERENT_TRAIT_GETTERS[monsterType](monster.combatantProperties.level);
  // equip weapons
  combatantProperties.equipment = getMonsterEquipment(monsterType);

  // @TESTING - remove this testing durability
  // for (const equipment of CombatantEquipment.getAllEquippedItems(monster.combatantProperties, {})) {
  //   setEquipmentDurability(equipment, 1);
  // }
  // set hp and mp to max
  CombatantProperties.setHpAndMpToMax(monster.combatantProperties);
  // @TODO - assign abilities (realistically need to refactor monster creation)

  combatantProperties.aiTypes = [AiType.Healer];
  // monster.combatantProperties.hitPoints = Math.floor(monster.combatantProperties.hitPoints * 0.5);
  // @TESTING - random evasion
  combatantProperties.inherentAttributes[CombatAttribute.Evasion] = Math.floor(Math.random() * 20);

  combatantProperties.abilityProperties.traitProperties.inherentKineticDamageTypeAffinities[
    KineticDamageType.Piercing
  ] = 10;

  return monster;
}

function setEquipmentDurability(equipment: Equipment, durability: number) {
  if (!equipment.durability) return;
  equipment.durability.current = durability;
}
