import { Quaternion, Vector3 } from "@babylonjs/core";
import { CombatantAbilityProperties } from "./combatant-abilities/combatant-ability-properties.js";
import { CombatantControlledBy } from "./combatant-controllers.js";
import { CombatantSpecies } from "./combatant-species.js";
import getCombatantTotalElementalAffinities from "./combatant-traits/get-combatant-total-elemental-affinities.js";
import getCombatantTotalKineticDamageTypeAffinities from "./combatant-traits/get-combatant-total-kinetic-damage-type-affinities.js";
import { cloneVector3 } from "../utils/index.js";
import { MonsterType } from "../monsters/monster-types.js";
import { CombatantEquipment } from "./combatant-equipment/index.js";
import { ActionUserTargetingProperties } from "../action-user-context/action-user-targeting-properties.js";
import { CombatantAttributeProperties } from "./attribute-properties.js";
import { ThreatManager } from "./threat-manager/index.js";
import { EntityId } from "../primatives/index.js";
import { AiType, CombatantClass, CombatantCondition, Inventory } from "./index.js";
import { plainToInstance } from "class-transformer";
import { CombatActionName } from "../combat/combat-actions/index.js";
import { IActionUser } from "../action-user-context/action-user.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import {
  ClassProgressionProperties,
  CombatantClassProperties,
} from "./class-progression-properties.js";
import { deserializeCondition } from "./combatant-conditions/deserialize-condition.js";
import { makeAutoObservable } from "mobx";
import { CombatantResources } from "./combatant-resources.js";
import { MitigationProperties } from "./combatant-mitigation-properties.js";

export class CombatantProperties {
  // subsystems
  attributeProperties = new CombatantAttributeProperties();
  equipment: CombatantEquipment = new CombatantEquipment();
  inventory: Inventory = new Inventory();
  resources: CombatantResources = new CombatantResources();
  abilityProperties = new CombatantAbilityProperties();
  targetingProperties = new ActionUserTargetingProperties();
  threatManager?: ThreatManager;
  classProgressionProperties = new ClassProgressionProperties(
    new CombatantClassProperties(1, CombatantClass.Warrior)
  );
  mitigationProperties = new MitigationProperties();

  // ACHIEVEMENTS
  deepestFloorReached: number = 1;

  // CONDITIONS
  conditions: CombatantCondition[] = [];

  // POSITION
  position: Vector3;
  public homeRotation: Quaternion = Quaternion.Zero();

  constructor(
    mainClassType: CombatantClass,
    public combatantSpecies: CombatantSpecies,
    public monsterType: null | MonsterType,
    public controlledBy: CombatantControlledBy,
    public homeLocation: Vector3
  ) {
    this.position = homeLocation;

    this.classProgressionProperties.setMainClass(mainClassType);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    this.attributeProperties.initialize(this);
    this.abilityProperties.initialize(this);
    this.inventory.initialize(this);
    this.equipment.initialize(this);
    this.resources.initialize(this);
    this.classProgressionProperties.initialize(this);
    this.mitigationProperties.initialize(this);
  }

  static getDeserialized(combatantProperties: CombatantProperties) {
    const deserialized = plainToInstance(CombatantProperties, combatantProperties);
    deserialized.inventory = Inventory.getDeserialized(deserialized.inventory);
    deserialized.equipment = CombatantEquipment.getDeserialized(deserialized.equipment);
    deserialized.targetingProperties = ActionUserTargetingProperties.getDeserialized(
      deserialized.targetingProperties
    );
    deserialized.classProgressionProperties = ClassProgressionProperties.getDeserialized(
      deserialized.classProgressionProperties
    );
    deserialized.abilityProperties = CombatantAbilityProperties.getDeserialized(
      deserialized.abilityProperties
    );
    deserialized.attributeProperties = CombatantAttributeProperties.getDeserialized(
      deserialized.attributeProperties
    );
    deserialized.resources = CombatantResources.getDeserialized(deserialized.resources);

    if (deserialized.threatManager !== undefined) {
      deserialized.threatManager = ThreatManager.getDeserialized(deserialized.threatManager);
    }
    deserialized.controlledBy = CombatantControlledBy.getDeserialized(deserialized.controlledBy);

    deserialized.homeLocation = cloneVector3(deserialized.homeLocation);
    deserialized.position = cloneVector3(deserialized.position);

    const deserializedConditions = combatantProperties.conditions.map((condition) =>
      deserializeCondition(condition)
    );
    combatantProperties.conditions = deserializedConditions;

    return deserialized;
  }

  // CONDITIONS
  static getConditionById(combatantProperties: CombatantProperties, conditionId: EntityId) {
    for (const condition of combatantProperties.conditions) {
      if (condition.id === conditionId) return condition;
    }
    return null;
  }

  // AFFINITIES
  static getCombatantTotalElementalAffinities = getCombatantTotalElementalAffinities;
  static getCombatantTotalKineticDamageTypeAffinities =
    getCombatantTotalKineticDamageTypeAffinities;

  // ACTIONS
  static hasRequiredConsumablesToUseAction(actionUser: IActionUser, actionName: CombatActionName) {
    const action = COMBAT_ACTIONS[actionName];
    const consumableCost = action.costProperties.getConsumableCost(actionUser);
    if (consumableCost !== null) {
      const inventory = actionUser.getInventoryOption();
      if (inventory === null) throw new Error("expected user to have an inventory");
      const { type, level } = consumableCost;
      const consumableOption = inventory.getConsumableByTypeAndLevel(type, level);
      if (consumableOption === undefined) return false;
    }
    return true;
  }

  isDead() {
    return this.resources.getHitPoints() <= 0;
  }
}
