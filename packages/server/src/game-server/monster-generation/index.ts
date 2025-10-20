import { Vector3 } from "@babylonjs/core";
import { idGenerator } from "../../singletons/index.js";
import getSpawnableMonsterTypesByFloor from "./get-spawnable-monster-types-by-floor.js";
import {
  AbilityType,
  AiType,
  CombatActionName,
  Combatant,
  CombatantControllerType,
  Equipment,
  MONSTER_SPECIES,
  MONSTER_TYPE_STRINGS,
  MonsterType,
  getMonsterCombatantClass,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { getMonsterStartingAttributes } from "./get-monster-starting-attributes.js";
import { addAttributesToAccumulator } from "@speed-dungeon/common";
import { getMonsterPerLevelAttributes } from "./get-monster-per-level-attributes.js";
import { getMonsterEquipment } from "./get-monster-equipment.js";
import { ThreatManager } from "@speed-dungeon/common";
import { MONSTER_INHERENT_TRAIT_GETTERS } from "./monster-trait-getters.js";
import { initializeCombatAttributeRecord } from "@speed-dungeon/common";
import {
  CombatantProperties,
  ClassProgressionProperties,
  CombatantClassProperties,
} from "@speed-dungeon/common";
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
    new ClassProgressionProperties(new CombatantClassProperties(level, combatantClass)),
    combatantSpecies,
    monsterType,
    { controllerType: CombatantControllerType.Dungeon, controllerName: "" },
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
    // CombatActionName.Healing,
    // CombatActionName.PassTurn,
  ];

  for (const actionName of ownedActions) {
    combatantProperties.abilityProperties.allocateAbilityPoint({
      type: AbilityType.Action,
      actionName,
    });
  }

  // const entityProperties = { id: idGenerator.generate(), name: STOCK_MONSTER.name };
  // const combatantProperties = cloneDeep(STOCK_MONSTER.combatantProperties);

  // will modify this monster after creation with basic values
  const monster = new Combatant(entityProperties, combatantProperties);
  combatantProperties.threatManager = new ThreatManager();
  const inherentAttributes = initializeCombatAttributeRecord();

  const attributesPerLevel = getMonsterPerLevelAttributes(monsterType);
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(attributesPerLevel)) {
    const levelAdjustedValue = value * (level - 1);

    if (!inherentAttributes[attribute]) {
      inherentAttributes[attribute] = levelAdjustedValue;
    } else {
      inherentAttributes[attribute] += levelAdjustedValue;
    }
  }

  const startingAttributes = getMonsterStartingAttributes(monsterType);
  addAttributesToAccumulator(startingAttributes, inherentAttributes);

  iterateNumericEnumKeyedRecord(inherentAttributes).forEach(([attribute, value]) => {
    monster.combatantProperties.attributeProperties.setInherentAttributeValue(attribute, value);
  });

  // randomize their hp a little
  // const baseHp = combatantProperties.inherentAttributes[CombatAttribute.Hp] || 1;
  // const randomNumberNormalDistribution = randomNormal();
  // const modifiedHp = baseHp * (randomNumberNormalDistribution + 0.5);
  // monster.combatantProperties.inherentAttributes[CombatAttribute.Hp] = Math.floor(modifiedHp);

  // @PERF - make a lookup table for inherent monster type traits
  // traits
  combatantProperties.abilityProperties.getTraitProperties().inherentTraitLevels =
    MONSTER_INHERENT_TRAIT_GETTERS[monsterType](level);
  // equip weapons
  combatantProperties.equipment = getMonsterEquipment(monsterType);

  // set hp and mp to max
  CombatantProperties.setHpAndMpToMax(monster.combatantProperties);
  // @TODO - assign abilities (realistically need to refactor monster creation)

  combatantProperties.aiTypes = [AiType.Healer];
  // monster.combatantProperties.hitPoints = Math.floor(monster.combatantProperties.hitPoints * 0.5);
  // @TESTING - random evasion
  // combatantProperties.inherentAttributes[CombatAttribute.Evasion] = Math.floor(Math.random() * 20);

  // combatantProperties.abilityProperties.traitProperties.inherentKineticDamageTypeAffinities[
  //   KineticDamageType.Piercing
  // ] = 100;

  // combatantProperties.abilityProperties.traitProperties.inherentElementalAffinities[
  //   MagicalElement.Fire
  // ] = 200;

  return monster;
}

function setEquipmentDurability(equipment: Equipment, durability: number) {
  if (!equipment.durability) return;
  equipment.durability.current = durability;
}
