// @TODO - combine common functionality with CombatantModelManager
export class ActionEntityModelManager {
  models = new Map<EntityId, ActionEntityModel>();

  register(model: ActionEntityModel) {
    if (model instanceof ActionEntityModel) this.models.set(model.id, model);
  }

  unregister(id: EntityId, cleanupMode: CleanupMode) {
    this.models.get(id)?.cleanup({ softCleanup: cleanupMode === CleanupMode.Soft });
    this.models.delete(id);
  }

  findOne(entityId: EntityId, updateOption?: EntityMotionUpdate): ActionEntityModel {
    const modelOption = this.models.get(entityId);
    if (!modelOption)
      throw new Error(
        ERROR_MESSAGES.GAME_WORLD.NO_ACTION_ENTITY_MODEL +
          ": " +
          entityId +
          JSON.stringify(updateOption)
      );
    return modelOption;
  }

  getAll() {
    return [...this.models.values()];
  }

  async spawnActionEntityModel(
    actionEntityName: ActionEntityName,
    position: Vector3,
    taggedDimensionsOption?: TaggedShape3DDimensions
  ) {
    const assetContainer = await ACTION_ENTITY_MODEL_FACTORIES[actionEntityName](
      position,
      taggedDimensionsOption
    );

    const parentMesh = assetContainer.meshes[0];
    if (!parentMesh) throw new Error("expected mesh was missing in imported scene");

    const transformNode = new TransformNode("");
    transformNode.position.copyFrom(parentMesh.position);
    parentMesh.setParent(transformNode);
    assetContainer.transformNodes.push(transformNode);
    return assetContainer;
  }
}
