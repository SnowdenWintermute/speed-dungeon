import { CombatantModelBlueprint } from "@/singletons/next-to-babylon-message-queue";
import {
  CombatantEquipment,
  CombatantSpecies,
  SKELETON_FILE_PATHS,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { importMesh } from "../../../utils";
import { GameWorld } from "../../";
import { ISceneLoaderAsyncResult } from "@babylonjs/core";
import { getCharacterModelPartCategoriesAndAssetPaths } from "./get-modular-character-parts";
import { setCharacterModelPartDefaultMaterials } from "./set-modular-character-part-default-materials";
import { CharacterModel } from "@/app/3d-world/scene-entities/character-models";

export async function spawnCharacterModel(
  world: GameWorld,
  blueprint: CombatantModelBlueprint
): Promise<Error | CharacterModel> {
  const { combatantProperties, entityProperties } = blueprint.combatant;

  const skeletonPath = SKELETON_FILE_PATHS[combatantProperties.combatantSpecies];

  const skeleton = await importMesh(skeletonPath, world.scene);

  const parts = getCharacterModelPartCategoriesAndAssetPaths(combatantProperties);

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

  const partPromises: Promise<ISceneLoaderAsyncResult | Error>[] = [];

  for (const part of parts) {
    const { assetPath } = part;
    if (!assetPath || assetPath === "") {
      console.error("no part asset path provided for part", part);
      continue;
    }

    partPromises.push(
      new Promise(async (resolve, _reject) => {
        const partResult = await modularCharacter.attachPart(part.category, assetPath);
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

  if (combatantProperties.combatantSpecies === CombatantSpecies.Humanoid) {
    const equippedHoldables = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);

    if (equippedHoldables)
      for (const [slot, item] of iterateNumericEnumKeyedRecord(equippedHoldables.holdables))
        await modularCharacter.equipHoldableModel(item, slot);

    const visibleHolsteredSlotIndex =
      combatantProperties.equipment.equippedHoldableHotswapSlotIndex === 0 ? 1 : 0;

    const visibleHolstered =
      CombatantEquipment.getHoldableHotswapSlots(combatantProperties)[visibleHolsteredSlotIndex];

    if (visibleHolstered)
      for (const [slot, item] of iterateNumericEnumKeyedRecord(visibleHolstered.holdables))
        await modularCharacter.equipHoldableModel(item, slot, true);
  }

  modularCharacter.updateBoundingBox();

  modularCharacter.startIdleAnimation(0, {});

  modularCharacter.setVisibility(1);

  return modularCharacter;
}
