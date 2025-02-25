import {
  ActivatedTriggersGameUpdateCommand,
  ERROR_MESSAGES,
  EntityMotionGameUpdateCommand,
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
    update.isComplete = true;
    // no-op????
    // or show floating text for counterspell, "triggered tech burst" "psionic explosion"
    // throw new Error("Function not implemented.");
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
    // spawnMobileVfxModel(vfxProperties.name).then((scene) => {
    //   const vfxModel = new MobileVfxModel(vfx.entityProperties.id, scene, vfxProperties.position);
    //   gameWorld.current!.vfxManager.register(vfxModel);
    // });
    update.isComplete = true;
  },
  [GameUpdateCommandType.EndTurn]: function (arg: any): Promise<void | Error> {
    throw new Error("Function not implemented.");
  },
};

//[GameUpdateCommandType.MobileVfx]: async function (update: {
//  command: MobileVfxGameUpdateCommand;
//  isComplete: boolean;
//}) {
//  const vfxName = MobileVfxName.Arrow;
//  if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
//  const id = gameWorld.current.idGenerator.generate();
//  const scene = await spawnMobileVfxModel(vfxName);
//  const { command } = update;
//  const { startPosition, destination } = command;
//  const vfx = new MobileVfx(id, scene, startPosition);
//  console.log(
//    "START: ",
//    startPosition,
//    "DEST: ",
//    destination,
//    "DISTANCE: ",
//    Vector3.Distance(startPosition, destination)
//  );
//  vfx.movementManager.startTranslating(destination, command.translationDuration, () => {
//    update.isComplete = true;
//    gameWorld.current?.vfxManager.unregister(vfx.id);
//  });

//  gameWorld.current.vfxManager.register(vfx);

//  // spawn the vfx model
//  // start the animation
//  // start movement
//  //
//  // isComplete = reached destination
//  // throw new Error("Function not implemented.");
//},
