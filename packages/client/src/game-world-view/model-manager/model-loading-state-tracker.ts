import { EntityId } from "@speed-dungeon/common";

export class ModelLoadingStateTracker {
  private modelLoadingStates = new Map<EntityId, boolean>();

  setModelLoading(entityId: EntityId) {
    this.modelLoadingStates.set(entityId, true);
  }

  setModelIsLoaded(entityId: EntityId) {
    this.modelLoadingStates.set(entityId, false);
  }

  clearModelLoadingState(entityId: EntityId) {
    this.modelLoadingStates.delete(entityId);
  }

  modelIsLoading(entityId: EntityId) {
    const modelIsLoading = this.modelLoadingStates.get(entityId);
    if (modelIsLoading === undefined) return true;
    return this.modelLoadingStates.get(entityId);
  }
}
