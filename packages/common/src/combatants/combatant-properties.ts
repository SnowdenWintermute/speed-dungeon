import { Quaternion, Vector3 } from "@babylonjs/core";
import { getActionNamesFilteredByUseableContext } from "./owned-actions/get-owned-action-names-filtered-by-usable-context.js";
import { Equipment, EquipmentType, HoldableSlotType } from "../items/equipment/index.js";
import { CombatantAbilityProperties } from "./combatant-abilities/combatant-ability-properties.js";
import { CombatantControlledBy, CombatantControllerType } from "./combatant-controllers.js";
import { AbilityTreeAbility, AbilityType, AbilityUtils } from "../abilities/index.js";
import { ABILITY_TREES } from "./ability-tree/set-up-ability-trees.js";
import { CombatantSpecies } from "./combatant-species.js";
import { COMBATANT_TRAIT_DESCRIPTIONS } from "./combatant-traits/index.js";
import getCombatantTotalElementalAffinities from "./combatant-traits/get-combatant-total-elemental-affinities.js";
import getCombatantTotalKineticDamageTypeAffinities from "./combatant-traits/get-combatant-total-kinetic-damage-type-affinities.js";
import { cloneVector3, iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { MonsterType } from "../monsters/monster-types.js";
import { CombatantEquipment } from "./combatant-equipment/index.js";
import { CombatantClass } from "./combatant-class/index.js";
import {
  ActionAndRank,
  ActionUserTargetingProperties,
} from "../action-user-context/action-user-targeting-properties.js";
import { CombatantAttributeProperties } from "./attribute-properties.js";
import { ThreatManager } from "./threat-manager/index.js";
import { EntityId } from "../primatives/index.js";
import { AiType, CombatantCondition, Inventory } from "./index.js";
import { plainToInstance } from "class-transformer";
import {
  ABILITY_POINTS_AWARDED_PER_LEVEL,
  ATTRIBUTE_POINTS_AWARDED_PER_LEVEL,
} from "../app-consts.js";
import { CombatActionName } from "../combat/combat-actions/index.js";
import { IActionUser } from "../action-user-context/action-user.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import { ClassProgressionProperties } from "./class-progression-properties.js";
import { deserializeCondition } from "./combatant-conditions/deserialize-condition.js";
import { makeAutoObservable } from "mobx";
import { CombatantResources } from "./combatant-resources.js";

export class CombatantProperties {
  // subsystems
  attributeProperties = new CombatantAttributeProperties();
  equipment: CombatantEquipment = new CombatantEquipment();
  inventory: Inventory = new Inventory();
  resources: CombatantResources = new CombatantResources();

  abilityProperties = new CombatantAbilityProperties();
  targetingProperties = new ActionUserTargetingProperties();

  threatManager?: ThreatManager;

  // controller
  summonedBy?: EntityId;
  aiTypes?: AiType[];

  // ACHIEVEMENTS
  deepestFloorReached: number = 1;

  // CONDITIONS
  conditions: CombatantCondition[] = [];

  // POSITION
  position: Vector3;
  public homeRotation: Quaternion = Quaternion.Zero();

  constructor(
    public classProgressionProperties: ClassProgressionProperties,
    public combatantSpecies: CombatantSpecies,
    public monsterType: null | MonsterType,
    /** We use the player name, even though it can change, because using the ownerId (snowauth id)
     * would expose it to the client. The tradeoff is a player can not change their username mid game without
     * forfeiting control of their characters. In practice, we ask their client to reconnect all sockets anyway
     * after a username change.
     * */
    public controlledBy: CombatantControlledBy,
    public homeLocation: Vector3
  ) {
    this.position = homeLocation;
    // this.ownedActions[CombatActionName.Attack] = new CombatantActionState(CombatActionName.Attack);
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    this.attributeProperties.initialize(this);
    this.inventory.initialize(this);
    this.equipment.initialize(this);
    this.resources.initialize(this);
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

    deserialized.homeLocation = cloneVector3(deserialized.homeLocation);
    deserialized.position = cloneVector3(deserialized.position);

    const deserializedConditions = combatantProperties.conditions.map((condition) =>
      deserializeCondition(condition)
    );
    combatantProperties.conditions = deserializedConditions;

    return deserialized;
  }

  isPlayerControlled() {
    return this.controlledBy.controllerType === CombatantControllerType.Player;
  }

  isDungeonControlled() {
    return this.controlledBy.controllerType === CombatantControllerType.Player;
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
  static getActionNamesFilteredByUseableContext = getActionNamesFilteredByUseableContext;
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
  static hasRequiredResourcesToUseAction(
    actionUser: IActionUser,
    actionAndRank: ActionAndRank,
    isInCombat: boolean
  ) {
    const { actionName, rank } = actionAndRank;

    const action = COMBAT_ACTIONS[actionName];
    const costs = action.costProperties.getResourceCosts(actionUser, isInCombat, rank);

    if (costs) {
      const unmetCosts = actionUser
        .getCombatantProperties()
        .resources.getUnmetCostResourceTypes(costs);
      if (unmetCosts.length) return false;
    }
    return true;
  }

  isDead() {
    return this.resources.getHitPoints() <= 0;
  }

  /** Returns the new level reached for this combatant if any */
  awardLevelups() {
    const levelupCount = this.classProgressionProperties.convertExperienceToClassLevels();

    for (let levelup = 0; levelup < levelupCount; levelup += 1) {
      this.abilityProperties.changeUnspentAbilityPoints(ABILITY_POINTS_AWARDED_PER_LEVEL);
      this.attributeProperties.changeUnspentPoints(ATTRIBUTE_POINTS_AWARDED_PER_LEVEL);

      this.resources.setToMax();
    }

    return this.classProgressionProperties.getMainClass().level;
  }

  changeSupportClassLevel(supportClass: CombatantClass, value: number) {
    this.resources.maintainResourcePercentagesAfterEffect(() => {
      this.classProgressionProperties.changeSupportClassLevel(supportClass, value);
      this.abilityProperties.changeUnspentAbilityPoints(1);
    });
  }

  // ACTION CALCULATION
  static canParry(combatantProperties: CombatantProperties): boolean {
    const holdables = combatantProperties.equipment.getActiveHoldableSlot();
    if (!holdables) return false;
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.OffHand) continue;
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (
        equipmentType === EquipmentType.OneHandedMeleeWeapon ||
        equipmentType === EquipmentType.TwoHandedMeleeWeapon
      )
        return true;
    }
    return false;
  }
  static canCounterattack(combatantProperties: CombatantProperties): boolean {
    return true;
  }
  static canBlock(combatantProperties: CombatantProperties): boolean {
    const holdables = combatantProperties.equipment.getActiveHoldableSlot();
    if (!holdables) return false;
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.MainHand) continue;
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (equipmentType === EquipmentType.Shield && !Equipment.isBroken(equipment)) return true;
    }
    return false;
  }

  // ABILITIES

  canAllocateAbilityPoint(ability: AbilityTreeAbility): {
    canAllocate: boolean;
    reasonCanNot?: string;
  } {
    const mainClass = this.classProgressionProperties.getMainClass();
    const isMainClassAbility = AbilityUtils.abilityAppearsInTree(
      ability,
      ABILITY_TREES[mainClass.combatantClass]
    );

    const supportClassOption = this.classProgressionProperties.getSupportClassOption();
    const hasSupportClass = supportClassOption !== null;

    const isSupportClassAbility =
      hasSupportClass &&
      AbilityUtils.abilityAppearsInTree(ability, ABILITY_TREES[supportClassOption.combatantClass]);

    if (!isSupportClassAbility && !isMainClassAbility) {
      return {
        canAllocate: false,
        reasonCanNot: "That ability is not in any of that combatant's ability trees",
      };
    }

    const { abilityProperties } = this;
    if (
      ability.type === AbilityType.Trait &&
      !COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].isAllocatable
    ) {
      return {
        canAllocate: false,
        reasonCanNot: "That trait is inherent to the combatant and can not be allocated to",
      };
    }

    // has unspent points
    if (abilityProperties.getUnspentPointsCount() <= 0) {
      return { canAllocate: false, reasonCanNot: "No unspent ability points" };
    }

    // ability is max level
    if (abilityProperties.ownedAbilityIsAtMaxAllocatableRank(ability)) {
      return { canAllocate: false, reasonCanNot: "That ability is at its maximum level" };
    }

    // is required character level
    const abilityRank = this.abilityProperties.getAbilityRank(ability);
    const isAtRequiredCharacterLevel =
      this.classProgressionProperties.isRequiredClassLevelToAllocateToAbility(
        ability,
        abilityRank,
        isSupportClassAbility
      );

    if (!isAtRequiredCharacterLevel) {
      return {
        canAllocate: false,
        reasonCanNot: "That character is too low level to allocate to this ability",
      };
    }

    // has prerequisite abilities
    const hasPrerequisiteAbilities = this.abilityProperties.hasPrerequisiteAbilities(ability);
    if (!hasPrerequisiteAbilities) {
      return {
        canAllocate: false,
        reasonCanNot: "Requires prerequisite",
      };
    }

    return { canAllocate: true };
  }
}
