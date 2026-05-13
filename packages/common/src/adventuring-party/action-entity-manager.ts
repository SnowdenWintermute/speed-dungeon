import { makeAutoObservable } from "mobx";
import { ActionEntity, ActionEntityName } from "../action-entities/index.js";
import { Battle } from "../battle/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityId } from "../aliases.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { MapUtils } from "../utils/map-utils.js";
import { ActionUserType } from "../action-user-context/action-user.js";

export class ActionEntityManager implements Serializable, ReactiveNode {
  private actionEntities = new Map<EntityId, ActionEntity>();

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return {
      actionEntities: MapUtils.serialize(this.actionEntities, (v) => v.toSerialized()),
    };
  }

  static fromSerialized(serialized: SerializedOf<ActionEntityManager>) {
    const deserialized = new ActionEntityManager();
    deserialized.actionEntities = MapUtils.deserialize(serialized.actionEntities, (v) =>
      ActionEntity.fromSerialized(v)
    );
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
        { type: ActionUserType.ActionEntity, actionEntityId: entity.entityProperties.id },
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
    for (const [_, actionEntity] of this.actionEntities) {
      if (actionEntity.actionEntityProperties.name === actionEntityType) return actionEntity;
    }
    return null;
  }

  unregisterActionEntitiesOnBattleEndOrNewRoom() {
    const removed = [];
    for (const [key, entity] of this.actionEntities) {
      removed.push(entity.entityProperties.id);
      this.unregisterActionEntity(key);
    }

    return removed;
  }
}
