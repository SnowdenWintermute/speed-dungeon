import { EntityId, MaxAndCurrent } from "../primatives/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityProperties } from "../primatives/index.js";
import { Inventory } from "./inventory/index.js";
import { CombatActionName, FriendOrFoe } from "../combat/combat-actions/index.js";
import { CombatantActionState } from "./owned-actions/combatant-action-state.js";
import { ConditionAppliedBy, ConditionTickProperties } from "./combatant-conditions/index.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import { COMBATANT_TIME_TO_MOVE_ONE_METER } from "../app-consts.js";
import { ActionEntityProperties } from "../action-entities/index.js";
import { ActionUserType, IActionUser } from "../action-user-context/action-user.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { Battle } from "../battle/index.js";
import { TurnTrackerEntityType } from "../combat/turn-order/turn-tracker-tagged-tracked-entity-ids.js";
import { CombatantAttributeRecord } from "./attribute-properties.js";
import { CombatantProperties } from "./combatant-properties.js";
import { Item } from "../items/index.js";
import { Equipment, WeaponProperties } from "../items/equipment/index.js";
import { HoldableSlotType } from "../items/equipment/slots.js";

export enum AiType {
  Healer,
}

export * from "./combatant-class/index.js";
export * from "./combatant-species.js";
export * from "./combatant-traits/index.js";
export * from "./owned-actions/index.js";
export * from "./inventory/index.js";
export * from "./combatant-equipment/index.js";
export * from "./combatant-conditions/index.js";
export * from "./threat-manager/index.js";
export * from "./combatant-traits/index.js";
export * from "./ability-tree/index.js";
export * from "./combatant-abilities/index.js";
export * from "./attributes/index.js";
export * from "./attribute-properties.js";
export * from "./class-progression-properties.js";

export class Combatant implements IActionUser {
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

  getSerialized() {
    const serialized = instanceToPlain(this) as Combatant;
    return serialized;
  }

  static getDeserialized(combatant: Combatant) {
    const toReturn = plainToInstance(Combatant, combatant);

    const { combatantProperties } = combatant;

    const deserializedCombatantProperties =
      CombatantProperties.getDeserialized(combatantProperties);

    deserializedCombatantProperties.initialize();

    toReturn.combatantProperties = deserializedCombatantProperties;

    return toReturn;
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
  setWasRemovedBeforeHitOutcomes(): void {}
  getConditionTickPropertiesOption(): null | ConditionTickProperties {
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
    return this.combatantProperties.position;
  }
  getHomePosition() {
    return this.combatantProperties.homeLocation;
  }
  getHomeRotation() {
    return this.combatantProperties.homeRotation;
  }
  getConditionAppliedBy(): ConditionAppliedBy {
    throw new Error("getConditionAppliedBy() is only valid on CombatantCondition");
  }

  getAllyAndOpponentIds(party: AdventuringParty): Record<FriendOrFoe, EntityId[]> {
    const { combatantManager } = party;
    return combatantManager.getCombatantIdsByDisposition(this.getEntityId());
  }

  getTargetingProperties = () => this.combatantProperties.targetingProperties;

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
  getEntityId(): EntityId {
    return this.entityProperties.id;
  }
  getLevel(): number {
    return this.combatantProperties.classProgressionProperties.getMainClass().level;
  }
  getTotalAttributes(): CombatantAttributeRecord {
    return this.combatantProperties.attributeProperties.getTotalAttributes();
  }
  getOwnedAbilities(): Partial<Record<CombatActionName, CombatantActionState>> {
    return this.combatantProperties.abilityProperties.getOwnedActions();
  }
  getEquipmentOption() {
    return this.combatantProperties.equipment;
  }
  getInventoryOption(): null | Inventory {
    return this.combatantProperties.inventory;
  }
  getIdOfEntityToCreditWithThreat(): EntityId {
    return this.entityProperties.id;
  }
  hasRequiredAttributesToUseItem(item: Item): boolean {
    return this.combatantProperties.attributeProperties.hasRequiredAttributesToUseItem(item);
  }

  getWeaponsInSlots(weaponSlots: HoldableSlotType[], options: { usableWeaponsOnly: boolean }) {
    return this.combatantProperties.equipment.getWeaponsInSlots(weaponSlots, options);
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

  canUseAction(
    targets: CombatActionTarget,
    actionAndRank: ActionAndRank,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Error | void {
    const { combatantProperties } = this;
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];

    if (action.costProperties.getMeetsCustomRequirements) {
      const { meetsRequirements, reasonDoesNot } = action.costProperties.getMeetsCustomRequirements(
        this,
        rank
      );
      if (!meetsRequirements) return new Error(reasonDoesNot);
    }

    const { abilityProperties } = this.combatantProperties;

    const combatActionPropertiesResult =
      abilityProperties.getCombatActionPropertiesIfOwned(actionAndRank);
    if (combatActionPropertiesResult instanceof Error) {
      return combatActionPropertiesResult;
    }

    const actionStateOption = abilityProperties.getOwnedActions()[action.name];
    if (actionStateOption && actionStateOption.cooldown && actionStateOption.cooldown.current)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.IS_ON_COOLDOWN);

    const hasRequiredConsumables = this.hasRequiredConsumablesToUseAction(action.name);
    if (!hasRequiredConsumables) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);

    const costs = action.costProperties.getResourceCosts(
      this,
      !!AdventuringParty.getBattleOption(party, game),
      rank
    );
    const hasRequiredResources =
      !this.combatantProperties.resources.getUnmetCostResourceTypes(costs).length;

    if (!hasRequiredResources)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);

    const isWearingRequiredEquipment =
      combatantProperties.equipment.isWearingRequiredEquipmentToUseAction(actionAndRank);
    if (!isWearingRequiredEquipment) {
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_WEARING_REQUIRED_EQUIPMENT);
    }

    // IF IN BATTLE, ONLY USE IF FIRST IN TURN ORDER
    let battleOption: null | Battle = null;
    if (party.battleId !== null) {
      const battle = game.battles[party.battleId];
      if (battle !== undefined) battleOption = battle;
      else return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
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

    const isInUsableContext = action.isUsableInThisContext(battleOption);
    if (!isInUsableContext)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_USABILITY_CONTEXT);

    // @TODO - TARGETS ARE NOT IN A PROHIBITED STATE
    // action would only make sense if we didn't already check valid states when targeting... unless
    // target state could change while they are already targeted, like if someone healed themselves
    // to full hp while someone else was targeting them with an autoinjector
  }
}
