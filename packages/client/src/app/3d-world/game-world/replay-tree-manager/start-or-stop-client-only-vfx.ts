import {
  ActionResolutionStepType,
  CLIENT_ONLY_VFX_CONSTRUCTORS,
  COMBAT_ACTIONS,
  ClientOnlyVfxNames,
  CombatActionName,
  ERROR_MESSAGES,
  EntityId,
  Milliseconds,
  VfxParentType,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import {
  SKELETON_MAIN_HAND_NAMES,
  SKELETON_OFF_HAND_NAMES,
  SKELETON_STRUCTURE_TYPE,
} from "../../combatant-models/modular-character/skeleton-structure-variables";
import { getChildMeshByName } from "../../utils";
import { Vector3 } from "@babylonjs/core";
import { ClientOnlyVfxManager } from "../../client-only-vfx-manager";

export function startOrStopClientOnlyVfx(
  actionName: CombatActionName,
  step: ActionResolutionStepType,
  clientOnlyVfxManager: ClientOnlyVfxManager,
  entityId: EntityId
) {
  const action = COMBAT_ACTIONS[actionName];

  let clientOnlyVfxNamesToStartThisStep: {
    name: ClientOnlyVfxNames;
    parentType: VfxParentType;
    lifetime?: Milliseconds;
  }[] = [];

  let clientOnlyVfxNamesToStopThisStep: ClientOnlyVfxNames[] = [];

  if (action.getClientOnlyVfxToStartByStep) {
    const clientOnlyVfxNamesToStart = action.getClientOnlyVfxToStartByStep();
    const clientOnlyVfxNamesForThisStep = clientOnlyVfxNamesToStart[step];
    if (clientOnlyVfxNamesForThisStep)
      clientOnlyVfxNamesToStartThisStep = clientOnlyVfxNamesForThisStep;
  }
  if (action.getClientOnlyVfxToStopByStep) {
    const clientOnlyVfxNamesToStop = action.getClientOnlyVfxToStopByStep();
    const clientOnlyVfxNamesForThisStep = clientOnlyVfxNamesToStop[step];
    if (clientOnlyVfxNamesForThisStep)
      clientOnlyVfxNamesToStopThisStep = clientOnlyVfxNamesForThisStep;
  }

  if (clientOnlyVfxNamesToStartThisStep.length) {
    const sceneOption = gameWorld.current?.scene;
    if (!sceneOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    for (const { name, parentType, lifetime } of clientOnlyVfxNamesToStartThisStep) {
      const effect = new CLIENT_ONLY_VFX_CONSTRUCTORS[name](sceneOption);

      if (lifetime !== undefined) {
        effect.lifetimeTimeout = setTimeout(() => {
          effect.softCleanup();
        }, lifetime);
      }

      clientOnlyVfxManager.clientOnlyVfx[name]?.softCleanup();
      clientOnlyVfxManager.clientOnlyVfx[name] = effect;

      switch (parentType) {
        case VfxParentType.UserMainHand:
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
        case VfxParentType.UserOffHand:
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
        case VfxParentType.VfxEntityRoot:
          {
            const vfxOption = gameWorld.current?.vfxManager.mobile[entityId];
            if (!vfxOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_VFX);
            effect.transformNode.setParent(vfxOption.movementManager.transformNode);
            effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
          }
          break;
        case VfxParentType.CombatantHitboxCenter:
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

  if (clientOnlyVfxNamesToStopThisStep.length) {
    for (const name of clientOnlyVfxNamesToStopThisStep) {
      clientOnlyVfxManager.clientOnlyVfx[name]?.softCleanup();
      delete clientOnlyVfxManager.clientOnlyVfx[name];
    }
  }
}
