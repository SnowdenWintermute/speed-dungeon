import { ERROR_MESSAGES } from "../errors/index.js";
import { Inventory } from "./inventory/index.js";
import { CombatantActionState } from "./owned-actions/combatant-action-state.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../app-consts.js";
import { ActionEntityProperties } from "../action-entities/index.js";
import { ActionUserType, IActionUser } from "../action-user-context/action-user.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Battle } from "../battle/index.js";
import { TurnTrackerEntityType } from "../combat/turn-order/turn-tracker-tagged-tracked-entity-ids.js";
import { CombatantProperties } from "./combatant-properties.js";
import { Item } from "../items/index.js";
import { HoldableSlotType } from "../items/equipment/slots.js";
import makeAutoObservable from "mobx-store-inheritance";
import { CombatantAttributeRecord } from "./combatant-attribute-record.js";
import { ConditionAppliedBy } from "../conditions/condition-applied-by.js";
import { EntityProperties } from "../primatives/entity-properties.js";
import { CombatantId, EntityId } from "../aliases.js";
import { MaxAndCurrent } from "../primatives/max-and-current.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatantConditionName } from "../conditions/condition-names.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { getItemSellPrice } from "../items/crafting/shard-sell-prices.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";

export class Combatant implements IActionUser, Serializable, ReactiveNode {
  constructor(
    public entityProperties: EntityProperties,
    public combatantProperties: CombatantProperties
  ) {}

  static createInitialized(
    entityProperties: EntityProperties,
    combatantProperties: CombatantProperties
  ) {
    const combatant = new Combatant(entityProperties, combatantProperties);
    combatant.combatantProperties.initialize();
    return combatant;
  }

  makeObservable(): void {
    console.log("making combatant observable");
    makeAutoObservable(this);
    this.combatantProperties.makeObservable();
  }

  toSerialized() {
    return {
      entityProperties: this.entityProperties,
      combatantProperties: this.combatantProperties.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<Combatant>) {
    const deserializedCombatantProperties = CombatantProperties.fromSerialized(
      serialized.combatantProperties
    );
    return new Combatant(serialized.entityProperties, deserializedCombatantProperties);
  }

  getType = () => ActionUserType.Combatant;
  getMovementSpeedOption(): null | number {
    return COMBATANT_TIME_TO_MOVE_ONE_METER;
  }
  getActionEntityProperties(): ActionEntityProperties {
    throw new Error("Combatants do not have ActionEntityProperties.");
  }
  wasRemovedBeforeHitOutcomes(): boolean {
    return false;
  }
  setWasRemovedBeforeHitOutcomes(): void {
    //
  }
  getConditionTickPropertiesOption(): null {
    throw new Error("getCombatantPropertiesOption() is invalid on Combatants.");
  }
  getConditionAppliedTo(): EntityId {
    throw new Error("getConditionAppliedTo() not valid on a combatant");
  }

  getCombatantProperties(): CombatantProperties {
    return this.combatantProperties;
  }
  getConditionStacks(): MaxAndCurrent {
    throw new Error("Only conditions have stacks");
  }
  getEntityProperties(): EntityProperties {
    return this.entityProperties;
  }
  getName(): string {
    return this.entityProperties.name;
  }
  getPositionOption() {
    return this.combatantProperties.transformProperties.position;
  }
  getHomePosition() {
    return this.combatantProperties.transformProperties.getHomePosition();
  }
  getHomeRotation() {
    return this.combatantProperties.transformProperties.homeRotation;
  }
  getConditionAppliedBy(): ConditionAppliedBy {
    throw new Error("getConditionAppliedBy() is only valid on CombatantCondition");
  }

  getAllyAndOpponentIds(party: AdventuringParty): Record<FriendOrFoe, EntityId[]> {
    const { combatantManager } = party;
    return combatantManager.getCombatantIdsByDisposition(this.getEntityId());
  }

  getTargetingProperties() {
    return this.combatantProperties.targetingProperties;
  }

  payResourceCosts(): void {
    throw new Error("Method not implemented.");
  }
  handleTurnEnded(): void {
    // REFILL THE QUICK ACTIONS OF THE CURRENT TURN
    // this way, if we want to remove their quick actions they can be at risk
    // of actions taking them away before they get their turn again
    this.combatantProperties.resources.refillActionPoints();
    this.combatantProperties.abilityProperties.tickCooldowns();
  }
  getEntityId() {
    return this.entityProperties.id as CombatantId;
  }
  getLevel(): number {
    return this.combatantProperties.classProgressionProperties.getMainClass().level;
  }
  getTotalAttributes(): CombatantAttributeRecord {
    return this.combatantProperties.attributeProperties.getTotalAttributes();
  }
  getOwnedActions(): Map<CombatActionName, CombatantActionState> {
    return this.combatantProperties.abilityProperties.getOwnedActions();
  }
  getEquipmentOption() {
    return this.combatantProperties.equipment;
  }
  getInventoryOption(): null | Inventory {
    return this.combatantProperties.inventory;
  }
  getIdOfEntityToCreditWithThreat(): EntityId {
    if (this.combatantProperties.giveThreatGeneratedToId) {
      return this.combatantProperties.giveThreatGeneratedToId;
    }
    return this.entityProperties.id;
  }
  hasRequiredAttributesToUseItem(item: Item): boolean {
    return this.combatantProperties.attributeProperties.hasRequiredAttributesToUseItem(item);
  }

  getWeaponsInSlots(weaponSlots: HoldableSlotType[], options: { usableWeaponsOnly: boolean }) {
    return this.combatantProperties.equipment.getWeaponsInSlots(weaponSlots, options);
  }

  getNaturalUnarmedWeapons() {
    return this.combatantProperties.equipment.getUnarmedWeapons();
  }

  hasRequiredConsumablesToUseAction(actionName: CombatActionName) {
    const action = COMBAT_ACTIONS[actionName];
    const consumableCost = action.costProperties.getConsumableCost(this);
    if (consumableCost !== null) {
      const inventory = this.getInventoryOption();
      if (inventory === null) throw new Error("expected user to have an inventory");
      const { type, level } = consumableCost;
      const consumableOption = inventory.getConsumableByTypeAndLevel(type, level);
      if (consumableOption === undefined) return false;
    }
    return true;
  }

  actionAndRankMeetsUseRequirements(
    actionAndRank: ActionAndRank,
    party: AdventuringParty,
    battleOption: Battle | null
  ): { canUse: boolean; reasonCanNot?: string } {
    const { combatantProperties } = this;
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];

    const isInUsableContext = action.isUsableInThisContext(battleOption);
    if (!isInUsableContext) {
      return {
        canUse: false,
        reasonCanNot: ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_USABILITY_CONTEXT,
      };
    }

    if (action.costProperties.getMeetsCustomRequirements) {
      const { meetsRequirements, reasonDoesNot } = action.costProperties.getMeetsCustomRequirements(
        this,
        party
      );
      if (!meetsRequirements) {
        return { canUse: false, reasonCanNot: reasonDoesNot };
      }
    }

    const { abilityProperties } = this.combatantProperties;

    const combatActionPropertiesResult =
      abilityProperties.getCombatActionPropertiesIfOwned(actionAndRank);
    if (combatActionPropertiesResult instanceof Error) {
      return { canUse: false, reasonCanNot: combatActionPropertiesResult.message };
    }

    const actionStateOption = abilityProperties.getOwnedActionOption(action.name);
    if (actionStateOption && actionStateOption.cooldown && actionStateOption.cooldown.current) {
      return { canUse: false, reasonCanNot: ERROR_MESSAGES.COMBAT_ACTIONS.IS_ON_COOLDOWN };
    }

    const hasRequiredConsumables = this.hasRequiredConsumablesToUseAction(action.name);
    if (!hasRequiredConsumables) {
      return { canUse: false, reasonCanNot: ERROR_MESSAGES.ITEM.NOT_OWNED };
    }

    const costs = action.costProperties.getResourceCosts(this, party.isInCombat(), rank);

    const unmetResourceTypes = this.combatantProperties.resources.getUnmetCostResourceTypes(costs);
    const hasRequiredResources = !unmetResourceTypes.length;

    if (!hasRequiredResources) {
      return {
        canUse: false,
        reasonCanNot: ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES,
      };
    }

    const isWearingRequiredEquipment =
      combatantProperties.equipment.isWearingRequiredEquipmentToUseAction(actionAndRank);
    if (!isWearingRequiredEquipment) {
      return {
        canUse: false,
        reasonCanNot: ERROR_MESSAGES.COMBAT_ACTIONS.NOT_WEARING_REQUIRED_EQUIPMENT,
      };
    }

    return { canUse: true };
  }

  canUseAction(
    actionAndRank: ActionAndRank,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Error | void {
    // IF IN BATTLE, ONLY USE IF FIRST IN TURN ORDER
    let battleOption: null | Battle = null;
    if (party.battleId !== null) {
      const battle = game.battles.get(party.battleId);
      if (battle !== undefined) battleOption = battle;
      else return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    }

    const meetsUseRequirements = this.actionAndRankMeetsUseRequirements(
      actionAndRank,
      party,
      battleOption
    );

    const { canUse, reasonCanNot } = meetsUseRequirements;
    if (!canUse) {
      return new Error(reasonCanNot || "unspecified reason can not use action");
    }

    if (battleOption !== null) {
      const fastestActor = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
      const taggedTrackedEntityId = fastestActor.getTaggedIdOfTrackedEntity();
      if (taggedTrackedEntityId.type !== TurnTrackerEntityType.Combatant)
        return new Error("expected a combatant to be first in turn order");
      if (taggedTrackedEntityId.combatantId !== this.entityProperties.id) {
        const message = `${ERROR_MESSAGES.COMBATANT.NOT_ACTIVE} first turn tracker ${JSON.stringify(fastestActor)}`;
        return new Error(message);
      }
    }

    // @TODO - TARGETS ARE NOT IN A PROHIBITED STATE
    // action would only make sense if we didn't already check valid states when targeting... unless
    // target state could change while they are already targeted, like if someone healed themselves
    // to full hp while someone else was targeting them with an autoinjector
  }

  static groupIsDead(group: Combatant[]) {
    // group length may be zero if you tame a pet and they were the last one left in that group
    if (group.length === 0) return true;
    for (const combatant of group) {
      const { combatantProperties } = combatant;
      const isDead = combatantProperties.isDead();
      const isAlive = !isDead;
      if (isAlive) return false;
    }

    return true;
  }

  targetFlyingConditionPreventsReachingMeleeRange(target: CombatantProperties) {
    const targetIsFlying = target.conditionManager.hasConditionName(CombatantConditionName.Flying);

    if (!targetIsFlying) {
      return false;
    }

    const userIsFlying = this.getCombatantProperties().conditionManager.hasConditionName(
      CombatantConditionName.Flying
    );

    if (userIsFlying) {
      return false;
    }

    return true;
  }

  movementIsRestrained(): boolean {
    return this.combatantProperties.conditionManager.hasConditionName(
      CombatantConditionName.Ensnared
    );
  }

  convertOwnedItemsToShards(itemIds: EntityId[]) {
    const { combatantProperties } = this;
    const itemsInInventory = combatantProperties.inventory.getItems();
    const equippedItems = combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: true,
    });

    if (itemIds.length === 0) return;
    for (const item of itemsInInventory.concat(equippedItems)) {
      if (!itemIds.includes(item.entityProperties.id)) continue;
      const shardsCount = this.convertItemToShards(item, combatantProperties);
      combatantProperties.inventory.changeShards(shardsCount);
      ArrayUtils.removeElement(itemIds, item.entityProperties.id);
      if (itemIds.length === 0) break;
    }
  }

  private convertItemToShards(item: Item, combatantProperties: CombatantProperties) {
    const itemId = item.entityProperties.id;
    const removedItemResult = combatantProperties.inventory.removeStoredOrEquipped(itemId);
    if (removedItemResult instanceof Error) throw removedItemResult;
    return getItemSellPrice(removedItemResult);
  }
}
