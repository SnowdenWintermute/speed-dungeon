import { makeAutoObservable } from "mobx";
import { ActionEntity, ActionEntityName } from "../action-entities/index.js";
import { Battle } from "../battle/index.js";
import { TurnTrackerEntityType } from "../combat/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityId } from "../primatives/index.js";
import { runIfInBrowser } from "../utils/index.js";

export class ActionEntityManager {
  private actionEntities: Record<EntityId, ActionEntity> = {};

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  getActionEntities() {
    return this.actionEntities;
  }

  registerActionEntity(entity: ActionEntity, battleOption: null | Battle) {
    const { entityProperties } = entity;
    this.actionEntities[entityProperties.id] = entity;

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
    delete this.actionEntities[entityId];
  }

  getActionEntityOption(entityId: EntityId) {
    const entityOption = this.actionEntities[entityId];
    return entityOption;
  }

  getExpectedActionEntity(entityId: EntityId) {
    const entityOption = this.actionEntities[entityId];
    if (entityOption === undefined) throw new Error(ERROR_MESSAGES.ACTION_ENTITIES.NOT_FOUND);
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
