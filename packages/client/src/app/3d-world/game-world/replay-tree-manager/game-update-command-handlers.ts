import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActivatedTriggersGameUpdateCommand,
  AnimationName,
  CombatantAnimationGameUpdateCommand,
  CombatantMovementGameUpdateCommand,
  ERROR_MESSAGES,
  GameUpdateCommandType,
  HitOutcomesGameUpdateCommand,
  MobileVfxGameUpdateCommand,
  ResourcesPaidGameUpdateCommand,
  StaticVfxGameUpdateCommand,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { ManagedAnimationOptions } from "../../combatant-models/animation-manager";
import { MobileVfxName } from "../../vfx/vfx-names";
import { MobileVfx, spawnMobileVfxModel } from "../../vfx";
import { Vector3 } from "@babylonjs/core";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Promise<Error | void>
> = {
  [GameUpdateCommandType.CombatantMovement]: async function (update: {
    command: CombatantMovementGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    const combatantModelOption =
      gameWorld.current?.modelManager.combatantModels[update.command.combatantId];
    if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    const { movementManager, animationManager } = combatantModelOption;

    console.log("HANDLING STEP: ", ACTION_RESOLUTION_STEP_TYPE_STRINGS[command.step]);

    movementManager.startTranslating(command.destination, () => {
      update.isComplete = true;
      if (command.endsTurnOnCompletion) {
        animationManager.startAnimationWithTransition(AnimationName.Idle, 500, {
          shouldLoop: true,
          animationEventOption: null,
          animationDurationOverrideOption: null,
          onComplete: () => {},
        });
      }
    });

    const options: ManagedAnimationOptions = {
      shouldLoop: true,
      animationEventOption: null,
      animationDurationOverrideOption: null,
      onComplete: function (): void {},
    };
    animationManager.startAnimationWithTransition(command.animationName, 500, options);
  },
  [GameUpdateCommandType.CombatantAnimation]: async function (update: {
    command: CombatantAnimationGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    const combatantModelOption =
      gameWorld.current?.modelManager.combatantModels[update.command.combatantId];
    if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    const { movementManager, animationManager } = combatantModelOption;

    movementManager.startTranslating(command.destination, () => {});

    const options: ManagedAnimationOptions = {
      shouldLoop: false,
      animationEventOption: null,
      animationDurationOverrideOption: command.duration,
      onComplete: function (): void {
        update.isComplete = true;
      },
    };
    animationManager.startAnimationWithTransition(command.animationName, 500, options);
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
  [GameUpdateCommandType.StaticVfx]: async function (update: {
    command: StaticVfxGameUpdateCommand;
    isComplete: boolean;
  }) {
    update.isComplete = true;
    // spawn the vfx model
    // start the animation
    //
    // isComplete = the animation frame percentage complete = update percent time to complete of total time to show
    // throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.MobileVfx]: async function (update: {
    command: MobileVfxGameUpdateCommand;
    isComplete: boolean;
  }) {
    const vfxName = MobileVfxName.Arrow;
    if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
    const id = gameWorld.current.idGenerator.generate();
    const scene = await spawnMobileVfxModel(vfxName);
    const { command } = update;
    const { startPosition, destination } = command;
    const vfx = new MobileVfx(id, scene, startPosition);
    console.log(
      "START: ",
      startPosition,
      "DEST: ",
      destination,
      "DISTANCE: ",
      Vector3.Distance(startPosition, destination)
    );
    vfx.movementManager.startTranslating(destination, () => {
      update.isComplete = true;
    });

    gameWorld.current.vfxManager.register(vfx);

    // spawn the vfx model
    // start the animation
    // start movement
    //
    // isComplete = reached destination
    // throw new Error("Function not implemented.");
  },
};
