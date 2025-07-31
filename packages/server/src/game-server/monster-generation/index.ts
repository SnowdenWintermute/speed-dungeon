import { Vector3 } from "@babylonjs/core";
import { idGenerator } from "../../singletons.js";
import getSpawnableMonsterTypesByFloor from "./get-spawnable-monster-types-by-floor.js";
import {
  CombatActionName,
  CombatAttribute,
  Combatant,
  CombatantActionState,
  CombatantProperties,
  Equipment,
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
import getMonsterTraits from "./get-monster-traits.js";
import { getMonsterEquipment } from "./get-monster-equipment.js";
import { ThreatManager } from "@speed-dungeon/common";
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

  const ownedActions = [
    CombatActionName.Attack,
    CombatActionName.Fire,
    CombatActionName.IceBoltParent,
    // CombatActionName.ChainingSplitArrowParent,
    // CombatActionName.ExplodingArrowParent,
    // CombatActionName.UseGreenAutoinjector,
    // CombatActionName.UseBlueAutoinjector,
    // CombatActionName.Blind,
    // CombatActionName.PassTurn,
  ];

  for (const actionName of ownedActions) {
    const action = new CombatantActionState(actionName);
    if (actionName === CombatActionName.Fire) action.level = 2;
    combatantProperties.ownedActions[actionName] = action;
  }

  // const entityProperties = { id: idGenerator.generate(), name: STOCK_MONSTER.name };
  // const combatantProperties = cloneDeep(STOCK_MONSTER.combatantProperties);

  // will modify this monster after creation with basic values
  const monster = new Combatant(entityProperties, combatantProperties);
  monster.combatantProperties.threatManager = new ThreatManager();
  monster.combatantProperties.level = level;
  // assign their "discretionary" attributes
  // assign attributes that would have come from wearing gear
  const startingAttributes = getMonsterStartingAttributes(monsterType);
  addAttributesToAccumulator(startingAttributes, monster.combatantProperties.inherentAttributes);
  const attributesPerLevel = getMonsterPerLevelAttributes(monsterType);
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(attributesPerLevel)) {
    const levelAdjustedValue = value * (monster.combatantProperties.level - 1);

    if (!monster.combatantProperties.inherentAttributes[attribute])
      monster.combatantProperties.inherentAttributes[attribute] = levelAdjustedValue;
    else monster.combatantProperties.inherentAttributes[attribute]! += levelAdjustedValue;
  }
  // randomize their hp a little
  const baseHp = monster.combatantProperties.inherentAttributes[CombatAttribute.Hp] || 1;
  const randomNumberNormalDistribution = randomNormal();
  const modifiedHp = baseHp * (randomNumberNormalDistribution + 0.5);
  monster.combatantProperties.inherentAttributes[CombatAttribute.Hp] = Math.floor(modifiedHp);

  // traits
  monster.combatantProperties.traits = getMonsterTraits(monsterType);
  // equip weapons
  monster.combatantProperties.equipment = getMonsterEquipment(monsterType);

  // @TESTING - remove this testing durability
  // for (const equipment of CombatantEquipment.getAllEquippedItems(monster.combatantProperties, {})) {
  //   setEquipmentDurability(equipment, 1);
  // }
  // set hp and mp to max
  CombatantProperties.setHpAndMpToMax(monster.combatantProperties);
  // @TODO - assign abilities (realistically need to refactor monster creation)

  return monster;
}

function setEquipmentDurability(equipment: Equipment, durability: number) {
  if (!equipment.durability) return;
  equipment.durability.current = durability;
}
