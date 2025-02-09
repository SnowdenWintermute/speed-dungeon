import {
  CombatantAnimationGameUpdateCommand,
  CombatantMovementGameUpdateCommand,
  ERROR_MESSAGES,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { TranslationTracker } from "../../model-movement-manager/model-movement-trackers";
import { ReplayBranchProcessor } from ".";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Error | void
> = {
  [GameUpdateCommandType.CombatantMovement]: function (update: {
    command: CombatantMovementGameUpdateCommand;
    isComplete: boolean;
  }): void | Error {
    const combatantModelOption =
      gameWorld.current?.modelManager.combatantModels[update.command.combatantId];
    if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    const { movementManager, animationManager } = combatantModelOption;
    movementManager.startTranslating(update.command.destination, () => {
      update.isComplete = true;
    });
    // get the combatant model's movement manager and issue it a move command with the original position and destination
    // get the combatant's animation manager and tell it to start transitioning to this movement animation repeating
    // to check if complete, check if the position is equal within a certain threshold
  },
  [GameUpdateCommandType.CombatantAnimation]: function (
    command: CombatantAnimationGameUpdateCommand
  ): void | Error {
    // get the combatant model's movement manager and issue it a move command with the original position and destination
    //
    // get the combatant's animation manager and tell it to start transitioning to this animation
    //
    // check if complete by reading the combatantModel.animationManager.isComplete()
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.ResourcesPaid]: function (): void | Error {
    // deduct the resources
    // enqueue the floating text messages
    //
    // completes instantly
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.ActivatedTriggers]: function (): void | Error {
    // no op????
    // or show floating text for counterspell, "triggered tech burst" "psionic explosion"
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.HitOutcomes]: function (): void | Error {
    // apply the damage
    // enqueue the floating text messages
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.StaticVfx]: function (): void | Error {
    // spawn the vfx model
    // start the animation
    //
    // isComplete = the animation frame percentage complete = update percent time to complete of total time to show
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.MobileVfx]: function (): void | Error {
    // spawn the vfx model
    // start the animation
    // start movement
    //
    // isComplete = reached destination
    throw new Error("Function not implemented.");
  },
};
