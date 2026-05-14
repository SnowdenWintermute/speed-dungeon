import { CombatantId } from "../../aliases.js";
import { MAX_PARTY_SIZE } from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { AllowedResult } from "../../primatives/index.js";
import { UserSession } from "../../servers/sessions/user-session.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class ProgressionGameLobbySetup implements GameModeLobbySetupPolicy {
  gameCanBeStarted(game: SpeedDungeonGame): AllowedResult {
    throw new Error("Method not implemented.");
  }
  userCanJoin(session: UserSession, game: SpeedDungeonGame): AllowedResult {
    if (!session.isAuth()) {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }

    if (game.players.size >= MAX_PARTY_SIZE) {
      return { allowed: false, reason: ERROR_MESSAGES.GAME.IS_FULL };
    }

    return { allowed: true };
  }
  userCanCreate(session: UserSession): AllowedResult {
    if (session.isAuth()) {
      return { allowed: true };
    } else {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
  }
  canSelectStartingFloor(): AllowedResult {
    return { allowed: true };
  }
  getMaxStartingFloor(game: SpeedDungeonGame): number {
    return game.maxStartingFloor;
  }
  onJoin(session: UserSession, game: SpeedDungeonGame): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getSelectableCharacterIds(session: UserSession, game: SpeedDungeonGame): Promise<CombatantId[]> {
    throw new Error("Method not implemented.");
  }
}
