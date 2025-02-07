import {
  CombatantAnimationGameUpdateCommand,
  CombatantMovementGameUpdateCommand,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Error | void
> = {
  [GameUpdateCommandType.CombatantAnimation]: function (
    command: CombatantAnimationGameUpdateCommand
  ): void | Error {
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.CombatantMovement]: function (
    command: CombatantMovementGameUpdateCommand
  ): void | Error {
    // gameWorld.current?.modelManager;
  },
  [GameUpdateCommandType.ResourcesPaid]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.ActivatedTriggers]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.HitOutcomes]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.StaticVfx]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.MobileVfx]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
};
