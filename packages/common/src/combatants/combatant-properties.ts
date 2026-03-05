import { Vector3 } from "@babylonjs/core";
import { CombatantAbilityProperties } from "./combatant-abilities/combatant-ability-properties.js";
import { CombatantControlledBy } from "./combatant-controllers.js";
import { CombatantSpecies } from "./combatant-species.js";
import { MonsterType } from "../monsters/monster-types.js";
import { CombatantEquipment } from "./combatant-equipment/index.js";
import { ActionUserTargetingProperties } from "../action-user-context/action-user-targeting-properties.js";
import { ThreatManager } from "./threat-manager/index.js";
import { Exclude, instanceToPlain, plainToInstance } from "class-transformer";
import {
  ClassProgressionProperties,
  CombatantClassProperties,
} from "./class-progression-properties.js";
import { makeAutoObservable } from "mobx";
import { CombatantResources } from "./combatant-resources.js";
import { MitigationProperties } from "./combatant-mitigation-properties.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { CombatantConditionManager } from "./condition-manager.js";
import { CombatantTransformProperties } from "./combatant-transform-properties.js";
import { runIfInBrowser } from "../utils/index.js";
import {
  CombatantAttributeProperties,
  CombatantClass,
  EntityId,
  ERROR_MESSAGES,
  Inventory,
} from "../index.js";

export interface CombatantOnDeathProperties {
  removeConditionsApplied: boolean;
}

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
  // need to specially serialize conditions,
  // see note on conditionManager.serializedConditions
  @Exclude()
  conditionManager = new CombatantConditionManager();
  transformProperties = new CombatantTransformProperties();

  // ACHIEVEMENTS
  deepestFloorReached: number = 1;

  onDeathProperties?: CombatantOnDeathProperties;
  removeFromPartyOnDeath?: boolean;
  giveThreatGeneratedToId?: EntityId;
  shouldDieWhenCombatantAttachedToDies?: boolean;

  constructor(
    mainClassType: CombatantClass,
    public combatantSpecies: CombatantSpecies,
    public monsterType: null | MonsterType,
    public controlledBy: CombatantControlledBy,
    homePosition: Vector3
  ) {
    // this happens when running plainToInstance, homePosition will be undefined
    // I don't know why but for now this works
    if (homePosition !== undefined) {
      this.transformProperties.position = homePosition;
      this.transformProperties.setHomePosition(homePosition.clone());
    }
    this.classProgressionProperties.setMainClass(mainClassType);

    runIfInBrowser(() => makeAutoObservable(this));
  }

  initialize() {
    for (const value of Object.values(this)) {
      const isSubsystem = value instanceof CombatantSubsystem;
      if (!isSubsystem) continue;
      value.initialize(this);
    }
  }

  getSerialized() {
    const serializedConditionManager = this.conditionManager.getSerialized();
    const serialized = instanceToPlain(this) as CombatantProperties;

    serialized.conditionManager = serializedConditionManager;
    serialized.abilityProperties = this.abilityProperties.getSerialized();
    return serialized;
  }

  static getDeserialized(combatantProperties: CombatantProperties) {
    const deserialized = plainToInstance(CombatantProperties, combatantProperties);

    deserialized.transformProperties = CombatantTransformProperties.getDeserialized(
      deserialized.transformProperties
    );
    deserialized.inventory = Inventory.getDeserialized(deserialized.inventory);
    deserialized.equipment = CombatantEquipment.getDeserialized(deserialized.equipment);
    deserialized.targetingProperties = ActionUserTargetingProperties.getDeserialized(
      deserialized.targetingProperties
    );
    // deserialized.classProgressionProperties = ClassProgressionProperties.getDeserialized(
    //   deserialized.classProgressionProperties
    // );
    deserialized.abilityProperties = CombatantAbilityProperties.getDeserialized(
      deserialized.abilityProperties
    );
    // deserialized.attributeProperties = CombatantAttributeProperties.fromSerialized(
    //   deserialized.attributeProperties
    // );
    deserialized.resources = CombatantResources.getDeserialized(deserialized.resources);

    if (deserialized.threatManager !== undefined) {
      deserialized.threatManager = ThreatManager.getDeserialized(deserialized.threatManager);
    }
    deserialized.controlledBy = CombatantControlledBy.getDeserialized(deserialized.controlledBy);
    deserialized.mitigationProperties = MitigationProperties.getDeserialized(
      deserialized.mitigationProperties
    );

    deserialized.conditionManager = CombatantConditionManager.getDeserialized(
      combatantProperties.conditionManager
    );

    return deserialized;
  }

  isDead() {
    return this.resources.getHitPoints() <= 0;
  }

  requireAlive() {
    if (this.isDead()) {
      throw new Error(ERROR_MESSAGES.COMBATANT.IS_DEAD);
    }
  }
}
