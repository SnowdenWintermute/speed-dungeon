import {
  CosmeticEffectNames,
  ERROR_MESSAGES,
  EntityId,
  Milliseconds,
  EntityReferencePoint,
  COSMETIC_EFFECT_CONSTRUCTORS,
} from "@speed-dungeon/common";
import { gameWorld, getGameWorld } from "../../SceneManager";
import { getChildMeshByName } from "../../utils";
import { Vector3 } from "@babylonjs/core";
import { CosmeticEffectManager } from "../../scene-entities/cosmetic-effect-manager";
import {
  BONE_NAMES,
  BoneName,
} from "../../scene-entities/character-models/skeleton-structure-variables";

export function startOrStopCosmeticEffect(
  cosmeticEffectToStart: {
    name: CosmeticEffectNames;
    parentType: EntityReferencePoint;
    lifetime?: Milliseconds;
  }[],
  cosmeticEffectToStop: CosmeticEffectNames[],
  cosmeticEffectManager: CosmeticEffectManager,
  entityId: EntityId
) {
  if (cosmeticEffectToStart.length) {
    const sceneOption = gameWorld.current?.scene;
    if (!sceneOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    for (const { name, parentType, lifetime } of cosmeticEffectToStart) {
      const effect = new COSMETIC_EFFECT_CONSTRUCTORS[name](sceneOption);

      if (lifetime !== undefined) {
        effect.lifetimeTimeout = setTimeout(() => {
          effect.softCleanup();
        }, lifetime);
      }

      cosmeticEffectManager.cosmeticEffect[name]?.softCleanup();
      cosmeticEffectManager.cosmeticEffect[name] = effect;

      switch (parentType) {
        case EntityReferencePoint.MainHandBone:
          {
            const boneName = BONE_NAMES[BoneName.EquipmentR];

            const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
            if (!combatantModelOption)
              throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
            const boneToParent = getChildMeshByName(combatantModelOption.rootMesh, boneName);
            if (!boneToParent) throw new Error("bone not found");
            effect.transformNode.setParent(boneToParent);
            effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
          }
          break;
        case EntityReferencePoint.OffHandBone:
          {
            const boneName = BONE_NAMES[BoneName.EquipmentL];

            const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
            if (!combatantModelOption)
              throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

            const boneToParent = getChildMeshByName(combatantModelOption.rootMesh, boneName);
            if (!boneToParent) throw new Error("bone not found");
            effect.transformNode.setParent(boneToParent);
            effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
          }
          break;
        case EntityReferencePoint.VfxEntityRoot:
          {
            const actionEntityModelOption = getGameWorld().actionEntityManager.findOne(entityId);
            effect.transformNode.setParent(actionEntityModelOption.movementManager.transformNode);
            effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
          }
          break;
        case EntityReferencePoint.CombatantHitboxCenter:
          {
            const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
            if (!combatantModelOption)
              throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

            effect.transformNode.setPositionWithLocalVector(
              combatantModelOption.getBoundingInfo().boundingSphere.centerWorld
            );
            effect.transformNode.setParent(combatantModelOption.movementManager.transformNode);
          }
          break;
      }
    }
  }

  if (cosmeticEffectToStop.length) {
    for (const vfxName of cosmeticEffectToStop) {
      cosmeticEffectManager.cosmeticEffect[vfxName]?.softCleanup();
      delete cosmeticEffectManager.cosmeticEffect[vfxName];
    }
  }
}
