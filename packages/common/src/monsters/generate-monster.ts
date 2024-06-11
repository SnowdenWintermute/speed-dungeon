import { Monster } from ".";
import { CombatantProperties } from "../combatants";
import { IdGenerator } from "../game/id_generator";
import getMonsterCombatantSpecies from "./get-monster-combatant-species";
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
}
