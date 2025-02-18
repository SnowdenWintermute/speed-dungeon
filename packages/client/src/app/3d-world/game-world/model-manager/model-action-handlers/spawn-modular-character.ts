import { CombatantModelBlueprint } from "@/singletons/next-to-babylon-message-queue";
import { ModularCharacter } from "../../../combatant-models/modular-character";
import {
  CombatantEquipment,
  CombatantSpecies,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { SKELETONS } from "../../../combatant-models/modular-character/modular-character-parts";
import { importMesh } from "../../../utils";
import { GameWorld } from "../../";
import { ISceneLoaderAsyncResult } from "@babylonjs/core";
import { getModularCharacterPartCategoriesAndAssetPaths } from "./get-modular-character-parts";
import { setModularCharacterPartDefaultMaterials } from "./set-modular-character-part-default-materials";

export async function spawnModularCharacter(
  world: GameWorld,
  blueprint: CombatantModelBlueprint
): Promise<Error | ModularCharacter> {
  const { combatantProperties, entityProperties } = blueprint.combatant;

  const skeletonPath = SKELETONS[combatantProperties.combatantSpecies];

  const skeleton = await importMesh(skeletonPath, world.scene);

  const parts = getModularCharacterPartCategoriesAndAssetPaths(combatantProperties);

  const modularCharacter = new ModularCharacter(
    entityProperties.id,
    world,
    combatantProperties.monsterType,
    !!combatantProperties.controllingPlayer,
    combatantProperties.combatantClass,
    skeleton,
    blueprint.modelDomPositionElement,
    null,
    blueprint.startPosition,
    blueprint.startRotation
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

        setModularCharacterPartDefaultMaterials(partResult, combatantProperties);
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

  return modularCharacter;
}
