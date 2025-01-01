import { gameWorld } from "@/app/3d-world/SceneManager";
import { Color3, ISceneLoaderAsyncResult, StandardMaterial } from "@babylonjs/core";
import { CombatantProperties, MagicalElement, MonsterType } from "@speed-dungeon/common";

export function setModularCharacterPartDefaultMaterials(
  partResult: ISceneLoaderAsyncResult,
  combatantProperties: CombatantProperties
) {
  if (combatantProperties.monsterType === MonsterType.FireElemental)
    for (const mesh of partResult.meshes) {
      if (mesh.material?.name === "cube-material") {
        // redMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
        const material = gameWorld.current?.defaultMaterials.elements[MagicalElement.Fire];
        if (!material) return;
        mesh.material = material;
      }
    }

  if (combatantProperties.monsterType === MonsterType.FireMage) {
    for (const mesh of partResult.meshes) {
      if (mesh.material?.name === "Purple") {
        const redMaterial = new StandardMaterial("red");
        redMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
        mesh.material = redMaterial;
      }
    }
  }

  if (combatantProperties.monsterType === MonsterType.Cultist) {
    for (const mesh of partResult.meshes) {
      if (mesh.material?.name === "Purple") {
        const whiteMaterial = new StandardMaterial("white");
        whiteMaterial.diffuseColor = new Color3(0.85, 0.75, 0.75);
        mesh.material = whiteMaterial;
      }
    }
  }
}
