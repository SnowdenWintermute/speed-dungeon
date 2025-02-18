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
  VfxType,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import {
  AnimationManager,
  ManagedAnimationOptions,
} from "../../combatant-models/animation-manager";
import { ModelMovementManager } from "../../model-movement-manager";
import { MobileVfxModel, spawnMobileVfxModel } from "../../vfx-models";
import { Vector3 } from "@babylonjs/core";

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
      console.log("attempting to apply motion to vfx", translationOption?.destination);
      const vfxOption = gameWorld.current?.vfxManager.mobile[entityId];
      if (!vfxOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_VFX);
      movementManager = vfxOption.movementManager;
    }

    console.log("destinationOption: ", translationOption?.destination);

    let translationIsComplete = false;
    let animationIsComplete = false;

    if (translationOption) {
      movementManager.startTranslating(
        translationOption.destination,
        translationOption.duration,
        () => {
          translationIsComplete = true;
          console.log(
            "animationIsComplete after translation: ",
            ACTION_RESOLUTION_STEP_TYPE_STRINGS[command.step],
            animationIsComplete
          );
          if (
            animationIsComplete ||
            !animationOption ||
            animationOption.timing.type === AnimationTimingType.Looping
          )
            update.isComplete = true;
        }
      );
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
          console.log(
            "translation is complete after animation: ",
            ACTION_RESOLUTION_STEP_TYPE_STRINGS[command.step],
            animationIsComplete
          );
          if (translationIsComplete || !translationOption) update.isComplete = true;
        },
      };
      animationManager.startAnimationWithTransition(animationOption.name, 500, options);
    } else {
      animationIsComplete = true;
    }

    if (!translationOption && !animationOption) {
      update.isComplete = true;
      console.log("marked motion as complete due to no translationOption and no animationOption");
    }
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
    const { vfxProperties } = vfx;
    if (vfxProperties.vfxType !== VfxType.Mobile) {
      return new Error("non-mobile vfx not implemented");
    }

    const scene = await spawnMobileVfxModel(vfxProperties.name);
    const vfxModel = new MobileVfxModel(vfx.entityProperties.id, scene, vfxProperties.position);
    gameWorld.current.vfxManager.register(vfxModel);
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
