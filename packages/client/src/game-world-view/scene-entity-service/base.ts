import { CleanupMode, EntityId } from "@speed-dungeon/common";
import { SceneEntityLoadingStateTracker } from "./loading-state-tracker";
import { SceneEntity } from "../scene-entities/base";

export abstract class SceneEntityManager<T extends SceneEntity> {
  sceneEntities = new Map<EntityId, T>();
  readonly loadingStates = new SceneEntityLoadingStateTracker();

  async register(sceneEntity: T) {
    const { entityId } = sceneEntity;
    this.sceneEntities.set(entityId, sceneEntity);
    await this.onRegister(sceneEntity);
  }

  protected abstract onRegister(sceneEntity: T): Promise<void>;

  unregister(id: EntityId, cleanupMode: CleanupMode) {
    this.sceneEntities.get(id)?.cleanup({ softCleanup: cleanupMode === CleanupMode.Soft });
    this.sceneEntities.delete(id);
  }

  requireById(entityId: EntityId) {
    const option = this.getOptional(entityId);
    if (!option) {
      throw new Error(`scene entity of id ${entityId} not found`);
    }
    return option;
  }

  getOptional(entityId: EntityId) {
    return this.sceneEntities.get(entityId);
  }

  getAll() {
    return [...this.sceneEntities.values()];
  }

  clearAll() {
    for (const [id, _sceneEntity] of this.sceneEntities) {
      this.unregister(id, CleanupMode.Immediate);
    }
  }
}
