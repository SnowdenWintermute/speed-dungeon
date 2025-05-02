import { gameWorld } from "@/app/3d-world/SceneManager";
import { Color3, ISceneLoaderAsyncResult, StandardMaterial } from "@babylonjs/core";
import { CombatantProperties, MagicalElement, MonsterType } from "@speed-dungeon/common";

export function setCharacterModelPartDefaultMaterials(
  partResult: ISceneLoaderAsyncResult,
  combatantProperties: CombatantProperties
) {
  if (combatantProperties.controllingPlayer) {
    for (const mesh of partResult.meshes) {
      if (mesh.material?.name === "Purple") {
        // mesh.material.dispose();
        // const newMaterial = new StandardMaterial("test");
        // newMaterial.diffuseColor = new Color3(0.3, 0.4, 0.6);
        // mesh.material = newMaterial;
      }
    }
  }
  if (combatantProperties.monsterType === MonsterType.Scavenger)
    for (const mesh of partResult.meshes) {
      if (mesh.material?.name === "Brown") {
        mesh.material.dispose();
        const newMaterial = gameWorld.current?.defaultMaterials.elements[MagicalElement.Dark];
        if (!newMaterial) return;
        mesh.material = newMaterial.clone("material");
      }
    }

  if (combatantProperties.monsterType === MonsterType.FireElemental)
    for (const mesh of partResult.meshes) {
      console.log("material: ", mesh.material?.name);
      if (mesh.material?.name === "cube-material") {
        mesh.material.dispose();
        const material = gameWorld.current?.defaultMaterials.elements[MagicalElement.Fire];
        if (!material) return;
        mesh.material = material.clone("material");
      }
    }

  if (combatantProperties.monsterType === MonsterType.FireMage) {
    for (const mesh of partResult.meshes) {
      if (mesh.material?.name === "Purple") {
        const redMaterial = new StandardMaterial("red");
        redMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
        mesh.material.dispose();
        mesh.material = redMaterial;
      }
    }
  }

  if (combatantProperties.monsterType === MonsterType.Cultist) {
    for (const mesh of partResult.meshes) {
      if (mesh.material?.name === "Purple") {
        const whiteMaterial = new StandardMaterial("white");
        whiteMaterial.diffuseColor = new Color3(0.85, 0.75, 0.75);
        mesh.material.dispose();
        mesh.material = whiteMaterial;
      }
    }
  }
}
