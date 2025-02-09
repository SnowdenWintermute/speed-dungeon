import {
  CombatantAnimationGameUpdateCommand,
  CombatantMovementGameUpdateCommand,
  ERROR_MESSAGES,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { ManagedAnimationOptions } from "../../combatant-models/animation-manager";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Error | void
> = {
  [GameUpdateCommandType.CombatantMovement]: function (update: {
    command: CombatantMovementGameUpdateCommand;
    isComplete: boolean;
  }): void | Error {
    const { command } = update;
    const combatantModelOption =
      gameWorld.current?.modelManager.combatantModels[update.command.combatantId];
    if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    const { movementManager, animationManager } = combatantModelOption;
    movementManager.startTranslating(command.destination, () => {
      update.isComplete = true;
    });

    const options: ManagedAnimationOptions = {
      shouldLoop: true,
      animationEventOption: null,
      animationDurationOverrideOption: null,
      onComplete: function (): void {},
    };
    animationManager.startAnimationWithTransition(command.animationName, 500, options);
  },
  [GameUpdateCommandType.CombatantAnimation]: function (update: {
    command: CombatantAnimationGameUpdateCommand;
    isComplete: boolean;
  }): void | Error {
    const { command } = update;
    const combatantModelOption =
      gameWorld.current?.modelManager.combatantModels[update.command.combatantId];
    if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    const { movementManager, animationManager } = combatantModelOption;
    movementManager.startTranslating(command.destination, () => {});

    const options: ManagedAnimationOptions = {
      shouldLoop: false,
      animationEventOption: null,
      animationDurationOverrideOption: null,
      onComplete: function (): void {
        update.isComplete = true;
      },
    };
    animationManager.startAnimationWithTransition(command.animationName, 500, options);
  },
  [GameUpdateCommandType.ResourcesPaid]: function (update: {
    command: CombatantAnimationGameUpdateCommand;
    isComplete: boolean;
  }): void | Error {
    update.isComplete = true;
    // deduct the resources
    // enqueue the floating text messages
    //
    // completes instantly
    // throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.ActivatedTriggers]: function (update: {
    command: CombatantAnimationGameUpdateCommand;
    isComplete: boolean;
  }): void | Error {
    update.isComplete = true;
    // no-op????
    // or show floating text for counterspell, "triggered tech burst" "psionic explosion"
    // throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.HitOutcomes]: function (update: {
    command: CombatantAnimationGameUpdateCommand;
    isComplete: boolean;
  }): void | Error {
    update.isComplete = true;
    // apply the damage
    // enqueue the floating text messages
    // throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.StaticVfx]: function (update: {
    command: CombatantAnimationGameUpdateCommand;
    isComplete: boolean;
  }): void | Error {
    update.isComplete = true;
    // spawn the vfx model
    // start the animation
    //
    // isComplete = the animation frame percentage complete = update percent time to complete of total time to show
    // throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.MobileVfx]: function (update: {
    command: CombatantAnimationGameUpdateCommand;
    isComplete: boolean;
  }): void | Error {
    update.isComplete = true;
    // spawn the vfx model
    // start the animation
    // start movement
    //
    // isComplete = reached destination
    // throw new Error("Function not implemented.");
  },
};
