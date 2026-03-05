import { makeAutoObservable } from "mobx";
import { ActionEntity, ActionEntityName } from "../action-entities/index.js";
import { Battle } from "../battle/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityId } from "../aliases.js";
import { runIfInBrowser } from "../utils/index.js";
import { TurnTrackerEntityType } from "../combat/turn-order/turn-tracker-tagged-tracked-entity-ids.js";

export class ActionEntityManager {
  private actionEntities = new Map<EntityId, ActionEntity>();

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  makeObservable() {
    makeAutoObservable(this);
  }

  getSerialized() {
    return {
      actionEntities: Object.fromEntries(this.actionEntities),
    };
  }

  static getDeserialized(plain: ReturnType<ActionEntityManager["getSerialized"]>) {
    const deserialized = new ActionEntityManager();
    deserialized.actionEntities = new Map(Object.entries(plain.actionEntities));
    return deserialized;
  }

  getActionEntities() {
    return this.actionEntities;
  }

  registerActionEntity(entity: ActionEntity, battleOption: null | Battle) {
    const { entityProperties } = entity;
    this.actionEntities.set(entityProperties.id, entity);

    const turnOrderSpeedOption = entity.actionEntityProperties.actionOriginData?.turnOrderSpeed;
    if (battleOption && turnOrderSpeedOption !== undefined) {
      // account for how long the battle has been going for
      const fastestSchedulerDelay =
        battleOption.turnOrderManager.turnSchedulerManager.getFirstScheduler().accumulatedDelay;

      const startingDelay = turnOrderSpeedOption + fastestSchedulerDelay;

      battleOption.turnOrderManager.turnSchedulerManager.addNewScheduler(
        { type: TurnTrackerEntityType.ActionEntity, actionEntityId: entity.entityProperties.id },
        startingDelay
      );
    }
  }

  unregisterActionEntity(entityId: EntityId) {
    this.actionEntities.delete(entityId);
  }

  getActionEntityOption(entityId: EntityId) {
    const entityOption = this.actionEntities.get(entityId);
    return entityOption;
  }

  getExpectedActionEntity(entityId: EntityId) {
    const entityOption = this.getActionEntityOption(entityId);
    if (entityOption === undefined) {
      throw new Error(ERROR_MESSAGES.ACTION_ENTITIES.NOT_FOUND);
    }
    return entityOption;
  }

  getExistingActionEntityOfType(actionEntityType: ActionEntityName) {
    for (const actionEntity of Object.values(this.actionEntities)) {
      if (actionEntity.actionEntityProperties.name === actionEntityType) return actionEntity;
    }
    return null;
  }

  unregisterActionEntitiesOnBattleEndOrNewRoom() {
    const removed = [];
    for (const [key, entity] of Object.entries(this.actionEntities)) {
      removed.push(entity.entityProperties.id);
      this.unregisterActionEntity(key);
    }

    return removed;
  }
}
