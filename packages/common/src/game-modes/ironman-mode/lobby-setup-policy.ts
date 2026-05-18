import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { AllowedResult } from "../../primatives/index.js";
import { PartySetupController } from "../../servers/lobby-server/controllers/party-setup.js";
import { UserSession } from "../../servers/sessions/user-session.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class IronmanModeLobbySetup extends GameModeLobbySetupPolicy {
  override modeSpecificStartRequirementsMet(game: SpeedDungeonGame): AllowedResult {
    // all ironman character players in contiuned ironman game have connected
    throw new Error("Method not implemented.");
  }

  override userCanJoin(session: UserSession, game: SpeedDungeonGame): AllowedResult {
    if (!session.isAuth()) {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
    if (game.isContinuedRun) {
      // @TODO - check if player was in the run
    }
    return { allowed: true };
  }

  // in an explicit IronmanGameCreation client intent handler we will
  // check user account for open ironman slot for this control mode (for new runs)
  // or if continuing a run, do they own the run
  override userCanCreate(session: UserSession): AllowedResult {
    if (!session.isAuth()) {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
    return { allowed: true };
  }

  override canSelectStartingFloor(): AllowedResult {
    return { allowed: false, reason: ERROR_MESSAGES.GAME.STARTING_FLOOR_NOT_SELECTABLE };
  }

  override getMaxStartingFloor(game: SpeedDungeonGame) {
    return 1;
  }

  override onCreation(game: SpeedDungeonGame): void {
    this.createDefaultPartyInGame(game);
  }

  override onJoin(
    session: UserSession,
    game: SpeedDungeonGame,
    partySetupController: PartySetupController
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    // if continued run, put the player with their previously controlled characters in the default party
    throw new Error("Method not implemented.");
  }

  override userCanAddCharacterToParty(
    session: UserSession,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): AllowedResult {
    if (game.isContinuedRun) {
      return { allowed: false, reason: ERROR_MESSAGES.GAME_SETUP.CONTINUED_GAME };
    }

    return { allowed: true };
  }

  override async getSelectableCharacterIds(
    session: UserSession,
    game: SpeedDungeonGame
  ): Promise<CombatantId[]> {
    return [];
  }
}
