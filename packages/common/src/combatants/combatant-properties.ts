import { Quaternion, Vector3 } from "@babylonjs/core";
import { combatantHasRequiredAttributesToUseItem } from "./can-use-item.js";
import { changeCombatantMana } from "./resources/change-mana.js";
import { changeCombatantHitPoints } from "./resources/change-hit-points.js";
import { clampResourcesToMax } from "./resources/clamp-resources-to-max.js";
import { getActionNamesFilteredByUseableContext } from "./owned-actions/get-owned-action-names-filtered-by-usable-context.js";
import { canPickUpItem } from "./inventory/can-pick-up-item.js";
import { Equipment, EquipmentType, HoldableSlotType } from "../items/equipment/index.js";
import { CombatantAbilityProperties } from "./combatant-abilities/combatant-ability-properties.js";
import { CombatantControlledBy, CombatantControllerType } from "./combatant-controllers.js";
import { Item } from "../items/index.js";
import { AbilityTreeAbility, AbilityType, AbilityUtils } from "../abilities/index.js";
import { ABILITY_TREES } from "./ability-tree/set-up-ability-trees.js";
import { CombatantSpecies } from "./combatant-species.js";
import { COMBATANT_TRAIT_DESCRIPTIONS } from "./combatant-traits/index.js";
import dropEquippedItem from "./inventory/drop-equipped-item.js";
import { dropItem } from "./inventory/drop-item.js";
import { getCombatantTotalAttributes } from "./attributes/get-combatant-total-attributes.js";
import getCombatantTotalElementalAffinities from "./combatant-traits/get-combatant-total-elemental-affinities.js";
import getCombatantTotalKineticDamageTypeAffinities from "./combatant-traits/get-combatant-total-kinetic-damage-type-affinities.js";
import { setResourcesToMax } from "./resources/set-resources-to-max.js";
import { cloneVector3, iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { MonsterType } from "../monsters/monster-types.js";
import {
  CombatantEquipment,
  applyEquipmentEffectWhileMaintainingResourcePercentages,
  equipItem,
  getWeaponsInSlots,
  unequipSlots,
} from "./combatant-equipment/index.js";
import { CombatAttribute } from "./attributes/index.js";
import { getOwnedEquipment } from "./inventory/get-owned-items.js";
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
import { ERROR_MESSAGES } from "../errors/index.js";
import {
  ABILITY_POINTS_AWARDED_PER_LEVEL,
  ATTRIBUTE_POINTS_AWARDED_PER_LEVEL,
  COMBATANT_MAX_ACTION_POINTS,
} from "../app-consts.js";
import {
  ActionPayableResource,
  CombatActionName,
  getUnmetCostResourceTypes,
} from "../combat/combat-actions/index.js";
import { IActionUser } from "../action-user-context/action-user.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import { ClassProgressionProperties } from "./class-progression-properties.js";

export class CombatantProperties {
  // subsystems
  abilityProperties = new CombatantAbilityProperties();
  targetingProperties = new ActionUserTargetingProperties();
  attributeProperties = new CombatantAttributeProperties();
  threatManager?: ThreatManager;
  equipment: CombatantEquipment = new CombatantEquipment();
  inventory: Inventory = new Inventory();

  // controller
  summonedBy?: EntityId;
  aiTypes?: AiType[];

  // RESOURCES
  hitPoints: number = 0;
  mana: number = 0;
  actionPoints: number = 0;

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
  }

  initialize() {
    // this.attributeProperties.initialize(this);
  }

  static getDeserialized(combatantProperties: CombatantProperties) {
    const deserialized = plainToInstance(CombatantProperties, combatantProperties);
    deserialized.inventory = Inventory.getDeserialized(deserialized.inventory);
    deserialized.equipment = CombatantEquipment.getDeserialized(deserialized.equipment);

    deserialized.homeLocation = cloneVector3(deserialized.homeLocation);
    deserialized.position = cloneVector3(deserialized.position);

    deserialized.targetingProperties = plainToInstance(
      ActionUserTargetingProperties,
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

    if (deserialized.threatManager !== undefined) {
      deserialized.threatManager = plainToInstance(ThreatManager, deserialized.threatManager);
    }

    return deserialized;
  }

  isPlayerControlled() {
    return this.controlledBy.controllerType === CombatantControllerType.Player;
  }

  isDungeonControlled() {
    return this.controlledBy.controllerType === CombatantControllerType.Player;
  }

  static getConditionById(combatantProperties: CombatantProperties, conditionId: EntityId) {
    for (const condition of combatantProperties.conditions) {
      if (condition.id === conditionId) return condition;
    }
    return null;
  }

  // ATTRIBUTES
  getTotalAttributes = () => getCombatantTotalAttributes(this);
  getUnmetItemRequirements(item: Item) {
    const totalAttributes = this.getTotalAttributes();

    const unmetAttributeRequirements: Set<CombatAttribute> = new Set();
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(item.requirements)) {
      const characterAttribute = totalAttributes[attribute] || 0;
      if (characterAttribute >= value) continue;
      else unmetAttributeRequirements.add(attribute);
    }

    return unmetAttributeRequirements;
  }

  // AFFINITIES
  static getCombatantTotalElementalAffinities = getCombatantTotalElementalAffinities;
  static getCombatantTotalKineticDamageTypeAffinities =
    getCombatantTotalKineticDamageTypeAffinities;

  // ACTIONS
  static getActionNamesFilteredByUseableContext = getActionNamesFilteredByUseableContext;

  // ITEMS / EQUIPMENT

  static canPickUpItem = canPickUpItem;
  static unequipSlots = unequipSlots;
  static dropItem = dropItem;
  static dropEquippedItem = dropEquippedItem;
  static combatantHasRequiredAttributesToUseItem = combatantHasRequiredAttributesToUseItem;
  static equipItem = equipItem;
  static getWeaponsInSlots = getWeaponsInSlots;
  static getOwnedEquipment = getOwnedEquipment;
  static getOwnedItemById(combatantProperties: CombatantProperties, itemId: EntityId) {
    const ownedEquipment = CombatantProperties.getOwnedEquipment(combatantProperties);
    for (const equipment of ownedEquipment) {
      if (equipment.entityProperties.id === itemId) return equipment;
    }
    const items = Inventory.getItems(combatantProperties.inventory);
    for (const item of items) {
      if (item.entityProperties.id === itemId) return item;
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }
  static removeOwnedItem(combatantProperties: CombatantProperties, itemId: EntityId) {
    let removedItemResult = Inventory.removeItem(combatantProperties.inventory, itemId);

    if (removedItemResult instanceof Error) {
      applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
        removedItemResult = combatantProperties.equipment.removeItem(itemId);
      });
    }
    return removedItemResult;
  }

  // RESOURCES
  static changeHitPoints = changeCombatantHitPoints;
  static changeMana = changeCombatantMana;
  static changeActionPoints(combatantProperties: CombatantProperties, value: number) {
    combatantProperties.actionPoints = Math.min(
      COMBATANT_MAX_ACTION_POINTS,
      Math.max(0, combatantProperties.actionPoints + value)
    );
  }
  static clampHpAndMpToMax = clampResourcesToMax;
  static setHpAndMpToMax = setResourcesToMax;
  static refillActionPoints(combatantProperties: CombatantProperties) {
    combatantProperties.actionPoints = COMBATANT_MAX_ACTION_POINTS;
  }
  static payResourceCosts(
    combatantProperties: CombatantProperties,
    costs: Partial<Record<ActionPayableResource, number>>
  ) {
    for (const [resource, cost] of iterateNumericEnumKeyedRecord(costs)) {
      switch (resource) {
        case ActionPayableResource.HitPoints:
          CombatantProperties.changeHitPoints(combatantProperties, cost);
          break;
        case ActionPayableResource.Mana:
          CombatantProperties.changeMana(combatantProperties, cost);
          break;
        case ActionPayableResource.Shards:
          break;
        case ActionPayableResource.ActionPoints:
          CombatantProperties.changeActionPoints(combatantProperties, cost);
          break;
      }
    }
  }

  static isDead(combatantProperties: CombatantProperties) {
    return combatantProperties.hitPoints <= 0;
  }

  /** Returns the new level reached for this combatant if any */
  awardLevelups() {
    const levelupCount = this.classProgressionProperties.convertExperienceToClassLevels();

    for (let levelup = 0; levelup < levelupCount; levelup += 1) {
      this.abilityProperties.changeUnspentAbilityPoints(ABILITY_POINTS_AWARDED_PER_LEVEL);
      this.attributeProperties.changeUnspentPoints(ATTRIBUTE_POINTS_AWARDED_PER_LEVEL);

      CombatantProperties.setHpAndMpToMax(this);
    }

    return this.classProgressionProperties.getMainClass().level;
  }

  changeSupportClassLevel(supportClass: CombatantClass, value: number) {
    applyEquipmentEffectWhileMaintainingResourcePercentages(this, () => {
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

  static hasRequiredConsumablesToUseAction(actionUser: IActionUser, actionName: CombatActionName) {
    const action = COMBAT_ACTIONS[actionName];
    const consumableCost = action.costProperties.getConsumableCost(actionUser);
    if (consumableCost !== null) {
      const inventory = actionUser.getInventoryOption();
      if (inventory === null) throw new Error("expected user to have an inventory");
      const { type, level } = consumableCost;
      const consumableOption = Inventory.getConsumableByTypeAndLevel(inventory, type, level);
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
      const unmetCosts = getUnmetCostResourceTypes(actionUser.getCombatantProperties(), costs);
      if (unmetCosts.length) return false;
    }
    return true;
  }

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
