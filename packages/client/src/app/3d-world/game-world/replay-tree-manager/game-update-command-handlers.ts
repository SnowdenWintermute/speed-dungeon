import {
  ActivatedTriggersGameUpdateCommand,
  DurabilityChangesByEntityId,
  ERROR_MESSAGES,
  EntityMotionGameUpdateCommand,
  Equipment,
  GameUpdateCommandType,
  HitOutcomesGameUpdateCommand,
  ResourcesPaidGameUpdateCommand,
  SpawnEntityGameUpdateCommand,
  SpawnableEntityType,
  VfxParentType,
  VfxType,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { MobileVfxModel, spawnMobileVfxModel } from "../../vfx-models";
import { getChildMeshByName } from "../../utils";
import {
  SKELETON_MAIN_HAND_NAMES,
  SKELETON_STRUCTURE_TYPE,
} from "../../combatant-models/modular-character/skeleton-structure-variables";
import { Vector3 } from "@babylonjs/core";
import { entityMotionGameUpdateHandler } from "./entity-motion";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes";
import { useGameStore } from "@/stores/game-store";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Promise<Error | void>
> = {
  [GameUpdateCommandType.EntityMotion]: async function (update: {
    command: EntityMotionGameUpdateCommand;
    isComplete: boolean;
  }) {
    entityMotionGameUpdateHandler(update);
  },
  [GameUpdateCommandType.ResourcesPaid]: async function (update: {
    command: ResourcesPaidGameUpdateCommand;
    isComplete: boolean;
  }) {
    update.isComplete = true;
    // deduct the resources
    // enqueue the floating text messages
    //
    // completes instantly
    // throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.ActivatedTriggers]: async function (update: {
    command: ActivatedTriggersGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    useGameStore.getState().mutateState((gameState) => {
      const game = gameState.game;
      if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      if (command.durabilityChanges) {
        gameState.rerenderForcer += 1; // for some reason it delays updating the durability indicators on bow use without this
        // playBeep();
        DurabilityChangesByEntityId.ApplyToGame(
          game,
          command.durabilityChanges,
          (combatant, equipment) => {
            // remove the model if it broke
            // @TODO - if this causes bugs because it is jumping the queue, look into it
            // if we use the queue though, it doesn't remove their item model imediately
            if (Equipment.isBroken(equipment)) {
              gameWorld.current?.modelManager.combatantModels[
                combatant.entityProperties.id
              ]?.unequipHoldableModel(equipment.entityProperties.id);
            }
          }
        );
      }
    });

    update.isComplete = true;
    // or show floating text for counterspell, "triggered tech burst" "psionic explosion"
  },
  [GameUpdateCommandType.HitOutcomes]: async function (update: {
    command: HitOutcomesGameUpdateCommand;
    isComplete: boolean;
  }) {
    update.isComplete = true;
    hitOutcomesGameUpdateHandler(update);
  },
  [GameUpdateCommandType.SpawnEntity]: async function (update: {
    command: SpawnEntityGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    if (command.entity.type !== SpawnableEntityType.Vfx) {
      update.isComplete = true;
      return;
    }
    if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    const { vfx } = command.entity;
    // console.log("SPAWNED VFX: ", vfx.vfxProperties.position);
    const { vfxProperties } = vfx;
    if (vfxProperties.vfxType !== VfxType.Mobile) {
      return new Error("non-mobile vfx not implemented");
    }

    const scene = await spawnMobileVfxModel(vfxProperties.name);
    const vfxModel = new MobileVfxModel(vfx.entityProperties.id, scene, vfxProperties.position);
    gameWorld.current.vfxManager.register(vfxModel);

    if (vfxProperties.parentOption) {
      if (vfxProperties.parentOption.type === VfxParentType.UserMainHand) {
        const actionUserOption =
          gameWorld.current.modelManager.combatantModels[vfxProperties.parentOption.parentEntityId];
        if (!actionUserOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
        const userMainHandBone = getChildMeshByName(
          actionUserOption.rootMesh,
          SKELETON_MAIN_HAND_NAMES[SKELETON_STRUCTURE_TYPE]
        );
        if (!userMainHandBone) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_EXPECTED_BONE);
        vfxModel.movementManager.transformNode.setParent(userMainHandBone);
        vfxModel.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
      }
    }

    update.isComplete = true;
  },
  [GameUpdateCommandType.EndTurn]: function (arg: any): Promise<void | Error> {
    throw new Error("Function not implemented.");
  },
};
