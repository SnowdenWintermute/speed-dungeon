import { Monster } from ".";
import { CombatAttribute, CombatantProperties } from "../combatants";
import { addAttributesToAccumulator } from "../combatants/get-combatant-total-attributes";
import { IdGenerator } from "../game/id_generator";
import { randomNormal } from "../utils";
import getMonsterCombatantSpecies from "./get-monster-combatant-species";
import getMonsterPerLevelAttributes from "./get-monster-per-level-attributes";
import getMonsterStartingAttributes from "./get-monster-starting-attributes";
import getSpawnableMonsterTypesByFloor from "./get-spawnable-monster-types-by-floor";
import { formatMonsterType, getMonsterCombatantClass } from "./monster-types";

export default function generateMonster(idGenerator: IdGenerator, level: number) {
  // roll a random monster type from list of pre determined types
  const spawnableTypes = getSpawnableMonsterTypesByFloor(level);
  const randomIndex = Math.floor(Math.floor(Math.random() * spawnableTypes.length));
  const monsterType = spawnableTypes[randomIndex]!;
  const combatantClass = getMonsterCombatantClass(monsterType);
  const combatantSpecies = getMonsterCombatantSpecies(monsterType);

  const entityProperties = {
    id: idGenerator.getNextEntityId(),
    name: formatMonsterType(monsterType),
  };
  const combatantProperties = new CombatantProperties(combatantClass, combatantSpecies, {}, null);
  // will modify this monster after creation with basic values
  const monster = new Monster(entityProperties, combatantProperties);
  monster.combatantProperties.level = level;
  // assign their "discretionary" attributes
  // assign attributes that would have come from wearing gear
  const startingAttributes = getMonsterStartingAttributes(monsterType);
  addAttributesToAccumulator(startingAttributes, monster.combatantProperties.inherentAttributes);
  const attributesPerLevel = getMonsterPerLevelAttributes(monsterType);
  for (const [attributeKey, value] of Object.entries(attributesPerLevel)) {
    const attribute = attributeKey as unknown as CombatAttribute;
    const levelAdjustedValue = value * (monster.combatantProperties.level - 1);
    if (!monster.combatantProperties.inherentAttributes[attribute])
      monster.combatantProperties.inherentAttributes[attribute] = levelAdjustedValue;
    else monster.combatantProperties.inherentAttributes[attribute]! += levelAdjustedValue;
  }
  // randomize their hp a little
  const baseHp = monster.combatantProperties.inherentAttributes[CombatAttribute.Hp] || 1;
  const randomNumberNormalDistribution = randomNormal();
  const modifiedHp = baseHp * (randomNumberNormalDistribution + 0.5);
  monster.combatantProperties.inherentAttributes[CombatAttribute.Hp] = modifiedHp;
  // traits
  // set hp and mp to max
  // equip weapons
  // assign abilities

  return monster;
}
