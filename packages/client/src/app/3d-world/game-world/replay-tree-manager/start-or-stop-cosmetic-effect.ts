import {
  CLIENT_ONLY_VFX_CONSTRUCTORS,
  CosmeticEffectNames,
  ERROR_MESSAGES,
  EntityId,
  Milliseconds,
  AbstractParentType,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import {
  SKELETON_MAIN_HAND_NAMES,
  SKELETON_OFF_HAND_NAMES,
  SKELETON_STRUCTURE_TYPE,
} from "../../combatant-models/modular-character/skeleton-structure-variables";
import { getChildMeshByName } from "../../utils";
import { Vector3 } from "@babylonjs/core";
import { CosmeticEffectManager } from "../../cosmetic-effect-manager";

export function startOrStopCosmeticEffect(
  cosmeticEffectToStart: {
    name: CosmeticEffectNames;
    parentType: AbstractParentType;
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
      const effect = new CLIENT_ONLY_VFX_CONSTRUCTORS[name](sceneOption);

      if (lifetime !== undefined) {
        effect.lifetimeTimeout = setTimeout(() => {
          effect.softCleanup();
        }, lifetime);
      }

      cosmeticEffectManager.cosmeticEffect[name]?.softCleanup();
      cosmeticEffectManager.cosmeticEffect[name] = effect;

      switch (parentType) {
        case AbstractParentType.UserMainHand:
          {
            const boneName = SKELETON_MAIN_HAND_NAMES[SKELETON_STRUCTURE_TYPE];

            const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
            if (!combatantModelOption)
              throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
            const boneToParent = getChildMeshByName(combatantModelOption.rootMesh, boneName);
            if (!boneToParent) throw new Error("bone not found");
            effect.transformNode.setParent(boneToParent);
            effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
          }
          break;
        case AbstractParentType.UserOffHand:
          {
            const boneName = SKELETON_OFF_HAND_NAMES[SKELETON_STRUCTURE_TYPE];

            const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
            if (!combatantModelOption)
              throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

            const boneToParent = getChildMeshByName(combatantModelOption.rootMesh, boneName);
            if (!boneToParent) throw new Error("bone not found");
            effect.transformNode.setParent(boneToParent);
            effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
          }
          break;
        case AbstractParentType.VfxEntityRoot:
          {
            const vfxOption = gameWorld.current?.vfxManager.mobile[entityId];
            if (!vfxOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_VFX);
            effect.transformNode.setParent(vfxOption.movementManager.transformNode);
            effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
          }
          break;
        case AbstractParentType.CombatantHitboxCenter:
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
