import { Vector3 } from "@babylonjs/core";
import { idGenerator } from "../../singletons.js";
import getSpawnableMonsterTypesByFloor from "./get-spawnable-monster-types-by-floor.js";
import {
  CombatAttribute,
  Combatant,
  CombatantProperties,
  formatMonsterType,
  getMonsterCombatantClass,
  getMonsterCombatantSpecies,
  randomNormal,
} from "@speed-dungeon/common";
import getMonsterStartingAttributes from "./get-monster-starting-attributes.js";
import { addAttributesToAccumulator } from "@speed-dungeon/common";
import getMonsterPerLevelAttributes from "./get-monster-per-level-attributes.js";
import getMonsterTraits from "./get-monster-traits.js";
import getMonsterEquipment from "./get-monster-equipment.js";
import getMonsterAbilities from "./get-monster-abilities.js";
// import { STOCK_MONSTER } from "../../index.js";
import cloneDeep from "lodash.clonedeep";

export default function generateMonster(level: number) {
  // roll a random monster type from list of pre determined types
  const spawnableTypes = getSpawnableMonsterTypesByFloor(level);
  const randomIndex = Math.floor(Math.floor(Math.random() * spawnableTypes.length));
  const monsterType = spawnableTypes[randomIndex]!;
  const combatantClass = getMonsterCombatantClass(monsterType);
  const combatantSpecies = getMonsterCombatantSpecies(monsterType);

  const entityProperties = {
    id: idGenerator.generate(),
    name: formatMonsterType(monsterType),
  };
  const combatantProperties = new CombatantProperties(
    combatantClass,
    combatantSpecies,
    monsterType,
    null,
    Vector3.Zero()
  );

  // const entityProperties = { id: idGenerator.generate(), name: STOCK_MONSTER.name };
  // const combatantProperties = cloneDeep(STOCK_MONSTER.combatantProperties);

  // will modify this monster after creation with basic values
  const monster = new Combatant(entityProperties, combatantProperties);
  monster.combatantProperties.level = level;
  // assign their "discretionary" attributes
  // assign attributes that would have come from wearing gear
  const startingAttributes = getMonsterStartingAttributes(monsterType);
  addAttributesToAccumulator(startingAttributes, monster.combatantProperties.inherentAttributes);
  const attributesPerLevel = getMonsterPerLevelAttributes(monsterType);
  for (const [attributeKey, value] of Object.entries(attributesPerLevel)) {
    const attribute = parseInt(attributeKey) as CombatAttribute;
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
  // set hp and mp to max
  CombatantProperties.setHpAndMpToMax(monster.combatantProperties);
  // equip weapons
  monster.combatantProperties.equipment = getMonsterEquipment(monsterType);
  // assign abilities
  monster.combatantProperties.abilities = getMonsterAbilities(monsterType);

  return monster;
}