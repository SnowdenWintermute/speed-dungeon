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
import { CombatantClass, Inventory } from "./index.js";
import { plainToInstance } from "class-transformer";
import {
  ClassProgressionProperties,
  CombatantClassProperties,
} from "./class-progression-properties.js";
import { makeAutoObservable } from "mobx";
import { CombatantResources } from "./combatant-resources.js";
import { MitigationProperties } from "./combatant-mitigation-properties.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { CombatantConditionManager } from "./condition-manager.js";

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
  conditionManager = new CombatantConditionManager();

  // ACHIEVEMENTS
  deepestFloorReached: number = 1;

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
    for (const value of Object.values(this)) {
      const isSubsystem = value instanceof CombatantSubsystem;
      if (!isSubsystem) continue;
      value.initialize(this);
    }
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
    deserialized.mitigationProperties = MitigationProperties.getDeserialized(
      deserialized.mitigationProperties
    );

    deserialized.conditionManager = CombatantConditionManager.getDeserialized(
      deserialized.conditionManager
    );

    deserialized.homeLocation = cloneVector3(deserialized.homeLocation);
    deserialized.position = cloneVector3(deserialized.position);

    return deserialized;
  }

  // AFFINITIES
  static getCombatantTotalElementalAffinities = getCombatantTotalElementalAffinities;
  static getCombatantTotalKineticDamageTypeAffinities =
    getCombatantTotalKineticDamageTypeAffinities;

  isDead() {
    return this.resources.getHitPoints() <= 0;
  }
}
