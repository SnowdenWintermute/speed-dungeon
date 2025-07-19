import { CombatantModelBlueprint } from "@/singletons/next-to-babylon-message-queue";
import { CombatantSpecies, SKELETON_FILE_PATHS } from "@speed-dungeon/common";
import { importMesh } from "../../../utils";
import { GameWorld } from "../../";
import { AssetContainer } from "@babylonjs/core";
import { setCharacterModelPartDefaultMaterials } from "./set-modular-character-part-default-materials";
import { CharacterModel } from "@/app/3d-world/scene-entities/character-models";
import { getCharacterModelPartCategoriesAndAssetPaths } from "@/app/3d-world/scene-entities/character-models/modular-character-parts-model-manager/get-modular-character-parts";
import { startOrStopCosmeticEffects } from "../../replay-tree-manager/start-or-stop-cosmetic-effect";

export async function spawnCharacterModel(
  world: GameWorld,
  blueprint: CombatantModelBlueprint
): Promise<Error | CharacterModel> {
  const { combatantProperties, entityProperties } = blueprint.combatant;

  const skeletonPath = SKELETON_FILE_PATHS[combatantProperties.combatantSpecies];
  const skeleton = await importMesh(skeletonPath, world.scene);

  const modularCharacter = new CharacterModel(
    entityProperties.id,
    world,
    combatantProperties.monsterType,
    !!combatantProperties.controllingPlayer,
    combatantProperties.combatantClass,
    skeleton,
    blueprint.modelDomPositionElement,
    null,
    blueprint.homePosition,
    blueprint.homeRotation
  );

  const parts = getCharacterModelPartCategoriesAndAssetPaths(combatantProperties);
  const partPromises: Promise<AssetContainer | Error>[] = [];

  for (const part of parts) {
    const { assetPath } = part;
    if (!assetPath || assetPath === "") {
      console.error("no part asset path provided for part", part);
      continue;
    }

    partPromises.push(
      new Promise(async (resolve, _reject) => {
        const partResult = await modularCharacter.modularCharacterPartsManager.attachPart(
          part.category,
          assetPath
        );
        if (partResult instanceof Error) {
          console.error(partResult);
          return resolve(partResult);
        }

        setCharacterModelPartDefaultMaterials(partResult, combatantProperties);
        resolve(partResult);
      })
    );
  }

  const results = await Promise.all(partPromises);
  for (const result of results) {
    if (result instanceof Error) console.error(result);
  }

  if (combatantProperties.combatantSpecies === CombatantSpecies.Humanoid)
    modularCharacter.equipmentModelManager.synchronizeCombatantEquipmentModels();

  modularCharacter.updateBoundingBox();

  modularCharacter.initChildTransformNodes();

  modularCharacter.startIdleAnimation(0, {});

  modularCharacter.setVisibility(1);

  return modularCharacter;
}
