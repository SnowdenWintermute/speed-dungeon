import { CombatantId } from "../../aliases.js";
import { GAME_CONFIG } from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { AllowedResult } from "../../primatives/index.js";
import { UserSession } from "../../servers/sessions/user-session.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class RankedRaceModeLobbySetup extends GameModeLobbySetupPolicy {
  override modeSpecificStartRequirementsMet(game: SpeedDungeonGame): AllowedResult {
    if (game.adventuringParties.size < GAME_CONFIG.MIN_RACE_GAME_PARTIES) {
      return {
        allowed: false,
        reason: ERROR_MESSAGES.GAME_SETUP.MINIMUM_PARTIES(GAME_CONFIG.MIN_RACE_GAME_PARTIES),
      };
    }
    return { allowed: true };
  }

  override async userCanJoin(session: UserSession): Promise<AllowedResult> {
    if (!session.isAuth()) {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
    return { allowed: true };
  }

  override userCanCreate(session: UserSession): AllowedResult {
    if (session.isAuth()) {
      return { allowed: true };
    } else {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
  }

  override canSelectStartingFloor(): AllowedResult {
    return { allowed: false, reason: ERROR_MESSAGES.GAME.MODE };
  }

  override getMaxStartingFloor(): number {
    return 1;
  }

  override onCreation() {
    // no-op
  }

  override async onJoin(): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    return outbox;
  }

  override async onLeave(): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    return undefined;
  }

  override async getSelectableCharacterIds(): Promise<CombatantId[]> {
    return [];
  }

  override userCanAddCharacterToParty(): AllowedResult {
    return { allowed: true };
  }
}
