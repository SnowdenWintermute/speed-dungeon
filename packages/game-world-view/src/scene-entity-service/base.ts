import { CleanupMode, EntityId } from "@speed-dungeon/common";
import { SceneEntityLoadingStateTracker } from "./loading-state-tracker";
import { SceneEntity } from "../scene-entities/base";
import { GameWorldView } from "..";
import { ClientApplication } from "@/client-application";

export abstract class SceneEntityManager<T extends SceneEntity> {
  sceneEntities = new Map<EntityId, T>();
  pendingEntitySpawns = new Map<
    EntityId,
    { pendingUpdates: ((sceneEntity: SceneEntity) => void)[] }
  >();
  readonly loadingStates = new SceneEntityLoadingStateTracker();

  constructor(
    protected clientApplication: ClientApplication,
    protected gameWorldView: GameWorldView
  ) {}

  async register(sceneEntity: T) {
    const { entityId } = sceneEntity;
    this.sceneEntities.set(entityId, sceneEntity);
    const pendingOption = this.pendingEntitySpawns.get(entityId);

    if (pendingOption === undefined) {
      throw new Error(
        `spawned an entity that was never marked as pending to spawn ${sceneEntity.stringName} ${sceneEntity.entityId}, ${JSON.stringify(this.pendingEntitySpawns)}`
      );
    }

    this.pendingEntitySpawns.delete(entityId);
    this.gameWorldView.sceneEntityService.startPendingQueuedEffects(sceneEntity);

    await this.onRegister(sceneEntity);

    // allow the caller to finish what it needs to do like setting the initial parent
    // at spawn before we apply the stored updates
    return () => {
      pendingOption.pendingUpdates.forEach((update) => {
        update(sceneEntity);
      });
    };
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
      console.log("unregistered:", id);
    }
  }
}
