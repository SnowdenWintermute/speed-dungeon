import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActivatedTriggersGameUpdateCommand,
  AnimationName,
  AnimationTimingType,
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
import {
  AnimationManager,
  ManagedAnimationOptions,
} from "../../combatant-models/animation-manager";
import { ModelMovementManager } from "../../model-movement-manager";
import { MobileVfxModel, spawnMobileVfxModel } from "../../vfx-models";
import { getChildMeshByName } from "../../utils";
import {
  SKELETON_MAIN_HAND_NAMES,
  SKELETON_STRUCTURE_TYPE,
} from "../../combatant-models/modular-character/skeleton-structure-variables";
import { Vector3 } from "@babylonjs/core";
import { plainToInstance } from "class-transformer";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Promise<Error | void>
> = {
  [GameUpdateCommandType.EntityMotion]: async function (update: {
    command: EntityMotionGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    let movementManager: ModelMovementManager;
    let animationManager: AnimationManager | undefined;
    const { entityId, translationOption, animationOption } = update.command;
    if (command.entityType === SpawnableEntityType.Combatant) {
      const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
      if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
      movementManager = combatantModelOption.movementManager;
      animationManager = combatantModelOption.animationManager;
    } else {
      // console.log("ATTEMPTING TO APPLY MOTION TO VFX", translationOption?.destination);
      const vfxOption = gameWorld.current?.vfxManager.mobile[entityId];
      if (!vfxOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_VFX);
      movementManager = vfxOption.movementManager;

      movementManager.transformNode.setParent(null);
    }

    // console.log("destinationOption: ", translationOption?.destination);

    let translationIsComplete = false;
    let animationIsComplete = false;

    if (translationOption) {
      const destination = plainToInstance(Vector3, translationOption.destination);
      // don't consider the y from the server since the server only calculates 2d positions
      if (command.entityType === SpawnableEntityType.Vfx) destination.y = 0.5;

      movementManager.startTranslating(destination, translationOption.duration, () => {
        translationIsComplete = true;
        if (
          animationIsComplete ||
          !animationOption ||
          animationOption.timing.type === AnimationTimingType.Looping
        ) {
          update.isComplete = true;
          if (command.despawnOnComplete) {
            if (command.entityType === SpawnableEntityType.Vfx) {
              gameWorld.current?.vfxManager.unregister(command.entityId);
            }
          }
        }

        if (animationManager && command.idleOnComplete)
          animationManager.startAnimationWithTransition(AnimationName.Idle, 500);
      });
    } else {
      translationIsComplete = true;
    }

    if (animationOption && animationManager) {
      if (animationOption.timing.type === AnimationTimingType.Looping) animationIsComplete = true;

      const options: ManagedAnimationOptions = {
        shouldLoop: animationOption.timing.type === AnimationTimingType.Looping,
        animationEventOption: null,
        animationDurationOverrideOption:
          animationOption.timing.type === AnimationTimingType.Timed
            ? animationOption.timing.duration
            : null,
        onComplete: function (): void {
          // otherwise looping animation will finish at an arbitrary time and could set an unintended action to complete
          if (animationOption.timing.type === AnimationTimingType.Looping) return;
          animationIsComplete = true;

          if (translationIsComplete || !translationOption) {
            update.isComplete = true;

            if (command.idleOnComplete)
              animationManager.startAnimationWithTransition(AnimationName.Idle, 500);
          }
        },
      };
      animationManager.startAnimationWithTransition(
        animationOption.name,
        command.instantTransition ? 0 : 500,
        options
      );
    } else {
      animationIsComplete = true;
    }

    if (!translationOption && !animationOption) update.isComplete = true;
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
    // apply the damage
    // enqueue the floating text messages
    // throw new Error("Function not implemented.");
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
