import { EntityId } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class SceneEntityLoadingStateTracker {
  private sceneEntityLoadingStates = new Map<EntityId, boolean>();

  constructor() {
    // observable so components re-render (and re-run their position-element effect) when a
    // model finishes loading; entityIsLoading stays a plain method so its reads are tracked
    // inside observer renders rather than being wrapped as an untracked action
    makeAutoObservable(this, { entityIsLoading: false });
  }

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
