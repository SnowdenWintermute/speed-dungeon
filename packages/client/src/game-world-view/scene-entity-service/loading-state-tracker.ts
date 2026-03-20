import { EntityId } from "@speed-dungeon/common";

export class SceneEntityLoadingStateTracker {
  private sceneEntityLoadingStates = new Map<EntityId, boolean>();

  setEntityLoading(entityId: EntityId) {
    this.sceneEntityLoadingStates.set(entityId, true);
  }

  setEntityIsLoaded(entityId: EntityId) {
    this.sceneEntityLoadingStates.set(entityId, false);
  }

  clearEntityLoadingState(entityId: EntityId) {
    this.sceneEntityLoadingStates.delete(entityId);
  }

  entityIsLoading(entityId: EntityId) {
    const sceneEntityIsLoading = this.sceneEntityLoadingStates.get(entityId);
    if (sceneEntityIsLoading === undefined) return true;
    return this.sceneEntityLoadingStates.get(entityId);
  }
}
