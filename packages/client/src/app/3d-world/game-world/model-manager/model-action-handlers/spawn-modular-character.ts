import { CombatantModelBlueprint } from "@/singletons/next-to-babylon-message-queue";
import { ModularCharacter } from "../../../combatant-models/modular-character";
import {
  CombatantClass,
  CombatantEquipment,
  CombatantSpecies,
  MonsterType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import {
  CHARACTER_PARTS,
  MONSTER_FULL_SKINS,
  ModularCharacterPartCategory,
  SKELETONS,
} from "../../../combatant-models/modular-character/modular-character-parts";
import { importMesh } from "../../../utils";
import { GameWorld } from "../../";
import { Color3, StandardMaterial } from "@babylonjs/core";

export async function spawnModularCharacter(
  world: GameWorld,
  blueprint: CombatantModelBlueprint
): Promise<Error | ModularCharacter> {
  const parts = [];
  const { combatantProperties, entityProperties } = blueprint.combatant;

  if (combatantProperties.monsterType !== null) {
    if (
      combatantProperties.monsterType === MonsterType.FireMage ||
      combatantProperties.monsterType === MonsterType.Cultist
    ) {
      parts.push({
        category: ModularCharacterPartCategory.Head,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Head] || "",
      });
      parts.push({
        category: ModularCharacterPartCategory.Torso,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Torso] || "",
      });
      parts.push({
        category: ModularCharacterPartCategory.Legs,
        assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Legs] || "",
      });
    } else {
      parts.push({
        category: ModularCharacterPartCategory.Full,
        assetPath: MONSTER_FULL_SKINS[combatantProperties.monsterType] || "",
      });
    }
  } else {
    // is humanoid
    let headPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Head];
    let torsoPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Torso];
    let legsPath =
      CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Legs];
    parts.push({ category: ModularCharacterPartCategory.Head, assetPath: headPath });
    parts.push({ category: ModularCharacterPartCategory.Torso, assetPath: torsoPath });
    parts.push({ category: ModularCharacterPartCategory.Legs, assetPath: legsPath });
  }
  const skeleton = await importMesh(SKELETONS[combatantProperties.combatantSpecies], world.scene);

  const modularCharacter = new ModularCharacter(
    entityProperties.id,
    world,
    combatantProperties.monsterType,
    combatantProperties.combatantClass,
    skeleton,
    blueprint.modelDomPositionElement,
    blueprint.startPosition,
    blueprint.startRotation,
    blueprint.modelCorrectionRotation
  );

  for (const part of parts) {
    if (!part.assetPath) {
      console.error("no part asset path provided for part", part);
      continue;
    }
    const partResult = await modularCharacter.attachPart(part.category, part.assetPath);
    if (partResult instanceof Error) return partResult;

    if (combatantProperties.monsterType === MonsterType.FireElemental)
      for (const mesh of partResult.meshes) {
        if (mesh.material?.name === "cube-material") {
          const redMaterial = new StandardMaterial("red");
          redMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
          mesh.material = redMaterial;
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
