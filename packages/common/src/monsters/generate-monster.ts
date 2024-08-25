import { Monster } from ".";
import { CombatAttribute, CombatantProperties } from "../combatants";
import { addAttributesToAccumulator } from "../combatants/get-combatant-total-attributes";
import { IdGenerator } from "../game/id-generator";
import { randomNormal } from "../utils";
import getMonsterAbilities from "./get-monster-abilities";
import getMonsterCombatantSpecies from "./get-monster-combatant-species";
import getMonsterEquipment from "./get-monster-equipment";
import getMonsterPerLevelAttributes from "./get-monster-per-level-attributes";
import getMonsterStartingAttributes from "./get-monster-starting-attributes";
import getMonsterTraits from "./get-monster-traits";
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
  const monster = new Monster(entityProperties, combatantProperties, monsterType);
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
  monster.combatantProperties.equipment = getMonsterEquipment(monsterType, idGenerator);
  // assign abilities
  monster.combatantProperties.abilities = getMonsterAbilities(monsterType);

  return monster;
}
