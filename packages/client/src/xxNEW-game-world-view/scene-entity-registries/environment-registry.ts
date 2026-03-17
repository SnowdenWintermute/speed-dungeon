export class EnvironmentRegistry {
  clearAllModels() {
    // for (const [_, model] of this.sceneEntities) model.cleanup({ softCleanup: false });
    // for (const [_, model] of this.environmentModels) {
    //   model.model.dispose();
    // }
    // this.environmentModels.clear();
    // this.sceneEntities.clear();
  }

  async spawnEnvironmentModel(
    id: string,
    path: string,
    position: Vector3,
    modelType: EnvironmentModelTypes,
    rotationQuat?: Quaternion
  ) {
    try {
      const model = await importMesh(path, this.world.scene);
      this.environmentModels.set(id, new EnvironmentModel(model));
      // if (model.transformNodes[0]) model.transformNodes[0].position = action.position;
      if (model.meshes[0]) model.meshes[0].position = position;

      const oldMaterials: Material[] = [];

      if (modelType === EnvironmentModelTypes.VendingMachine) {
        for (const mesh of model.meshes) {
          const materialName = mesh.material?.name;
          if (mesh.material) oldMaterials.push(mesh.material);

          if (materialName === MATERIAL_NAMES.ACCENT_1) {
            const material = new StandardMaterial("VendingMachineAccent1");
            material.diffuseColor = Color3.FromHexString(MAIN_BG_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_NAMES.ACCENT_2) {
            const material = new StandardMaterial("VendingMachineAccent2");
            material.diffuseColor = Color3.FromHexString(MAIN_TEXT_AND_BORDERS_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_NAMES.ACCENT_3) {
            const material = new StandardMaterial("VendingMachineAccent3");
            material.diffuseColor = Color3.FromHexString(HP_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_NAMES.ALTERNATE) {
            mesh.material = this.world.defaultMaterials.plastic[PlasticColor.Blue].clone("");
          }
          if (materialName === MATERIAL_NAMES.MAIN) {
            mesh.material = this.world.defaultMaterials.metal[LightestToDarkest.Darker].clone("");
          }
          if (materialName === "Dark") {
            const material = new StandardMaterial("VendingMachineDark");
            material.diffuseColor = Color3.FromHexString(MAIN_ACCENT_COLOR);
            mesh.material = material;
          }
        }
        for (const material of oldMaterials) {
          material.dispose(true, true, false);
        }
      }
    } catch (err) {
      console.trace(err);
      setAlert("Couldn't spawn environment model - check the console for error trace");
    }
  }

  despawnEnvironmentModel(id: EntityId) {
    const modelOption = this.environmentModels.get(id);
    if (modelOption) {
      modelOption.model.dispose();
      this.environmentModels.delete(id);
    }
  }
}
