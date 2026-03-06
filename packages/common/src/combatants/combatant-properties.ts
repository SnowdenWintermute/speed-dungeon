import { Vector3 } from "@babylonjs/core";
import { CombatantAbilityProperties } from "./combatant-abilities/combatant-ability-properties.js";
import { CombatantControlledBy } from "./combatant-controllers.js";
import { CombatantSpecies } from "./combatant-species.js";
import { MonsterType } from "../monsters/monster-types.js";
import { CombatantEquipment } from "./combatant-equipment/index.js";
import { ActionUserTargetingProperties } from "../action-user-context/action-user-targeting-properties.js";
import { ThreatManager } from "./threat-manager/index.js";
import { ClassProgressionProperties } from "./class-progression-properties.js";
import { makeAutoObservable } from "mobx";
import { CombatantResources } from "./combatant-resources.js";
import { MitigationProperties } from "./combatant-mitigation-properties.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { CombatantConditionManager } from "./condition-manager.js";
import { CombatantTransformProperties } from "./combatant-transform-properties.js";
import { CombatantClassProperties } from "./combatant-class-properties.js";
import {
  makePropertiesObservable,
  ReactiveNode,
  Serializable,
  SerializedOf,
} from "../serialization/index.js";
import { Inventory } from "./inventory/index.js";
import { CombatantAttributeProperties } from "./attribute-properties.js";
import { CombatantClass } from "./combatant-class/classes.js";
import { EntityId } from "../aliases.js";
import { removeUndefinedFields } from "../utils/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export interface CombatantOnDeathProperties {
  removeConditionsApplied: boolean;
}

export class CombatantProperties implements Serializable, ReactiveNode {
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
  }

  makeObservable() {
    makeAutoObservable(this);
    makePropertiesObservable(this);
  }

  initialize() {
    for (const value of Object.values(this)) {
      const isSubsystem = value instanceof CombatantSubsystem;
      if (!isSubsystem) {
        continue;
      }
      value.initialize(this);
    }
  }

  toSerialized() {
    const result = {
      attributeProperties: this.attributeProperties.toSerialized(),
      equipment: this.equipment.toSerialized(),
      inventory: this.inventory.toSerialized(),
      resources: this.resources.toSerialized(),
      abilityProperties: this.abilityProperties.toSerialized(),
      targetingProperties: this.targetingProperties.toSerialized(),
      threatManager: this.threatManager?.toSerialized(),
      classProgressionProperties: this.classProgressionProperties.toSerialized(),
      mitigationProperties: this.mitigationProperties.toSerialized(),
      conditionManager: this.conditionManager.toSerialized(),
      transformProperties: this.transformProperties.toSerialized(),
      deepestFloorReached: this.deepestFloorReached,
      onDeathProperties: this.onDeathProperties,
      removeFromPartyOnDeath: this.removeFromPartyOnDeath,
      giveThreatGeneratedToId: this.giveThreatGeneratedToId,
      shouldDieWhenCombatantAttachedToDies: this.shouldDieWhenCombatantAttachedToDies,
      combatantSpecies: this.combatantSpecies,
      monsterType: this.monsterType,
      controlledBy: this.controlledBy.toSerialized(),
      mainClassType: this.classProgressionProperties.getMainClass(),
    };

    return removeUndefinedFields(result);
  }

  static fromSerialized(serialized: SerializedOf<CombatantProperties>) {
    const controlledBy = CombatantControlledBy.fromSerialized(serialized.controlledBy);
    const transformProperties = CombatantTransformProperties.fromSerialized(
      serialized.transformProperties
    );
    const result = new CombatantProperties(
      serialized.mainClassType.combatantClass,
      serialized.combatantSpecies,
      serialized.monsterType,
      controlledBy,
      Vector3.Zero()
    );

    result.transformProperties = transformProperties;

    result.attributeProperties = CombatantAttributeProperties.fromSerialized(
      serialized.attributeProperties
    );
    result.equipment = CombatantEquipment.fromSerialized(serialized.equipment);
    result.inventory = Inventory.fromSerialized(serialized.inventory);
    result.resources = CombatantResources.fromSerialized(serialized.resources);
    result.abilityProperties = CombatantAbilityProperties.fromSerialized(
      serialized.abilityProperties
    );
    result.targetingProperties = ActionUserTargetingProperties.fromSerialized(
      serialized.targetingProperties
    );
    if (serialized.threatManager) {
      result.threatManager = ThreatManager.fromSerialized(serialized.threatManager);
    }
    result.classProgressionProperties = ClassProgressionProperties.fromSerialized(
      serialized.classProgressionProperties
    );
    result.mitigationProperties = MitigationProperties.fromSerialized(
      serialized.mitigationProperties
    );
    result.conditionManager = CombatantConditionManager.fromSerialized(serialized.conditionManager);
    result.deepestFloorReached = serialized.deepestFloorReached;
    result.onDeathProperties = serialized.onDeathProperties;
    result.removeFromPartyOnDeath = serialized.removeFromPartyOnDeath;
    result.giveThreatGeneratedToId = serialized.giveThreatGeneratedToId;
    result.shouldDieWhenCombatantAttachedToDies = serialized.shouldDieWhenCombatantAttachedToDies;

    result.initialize();

    return result;
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
