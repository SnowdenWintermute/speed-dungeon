import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantId, GameId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameCreationRequest } from "../../packets/client-intents.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { AllowedResult } from "../../primatives/index.js";
import { PartySetupController } from "../../servers/lobby-server/controllers/party-setup.js";
import { SavedIronmanRun } from "../../servers/services/user-game-data-persistence/saved-ironman-runs.js";
import { UserIdType } from "../../servers/sessions/user-ids.js";
import { UserSession } from "../../servers/sessions/user-session.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { invariant } from "../../utils/index.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class IronmanModeLobbySetup extends GameModeLobbySetupPolicy {
  override modeSpecificStartRequirementsMet(game: SpeedDungeonGame): AllowedResult {
    if (game.isContinuedRun) {
      // all ironman character players in contiuned ironman game have connected

      throw new Error("Method not implemented.");
    } else {
      return { allowed: true };
    }
  }

  override async userCanJoin(session: UserSession, game: SpeedDungeonGame): Promise<AllowedResult> {
    if (!session.isAuth()) {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
    if (game.isContinuedRun) {
      const serialized = await this.userGameDataPersistenceService.requireIronmanRun(game.id);
      const run = SavedIronmanRun.fromSerialized(serialized);
      const userNotInRun = !run.containsPlayerControlledByUser(session);
      if (userNotInRun) {
        return { allowed: false, reason: ERROR_MESSAGES.GAME_SETUP.PLAYER_NOT_IN_CONTINUED_GAME };
      }
    }
    return { allowed: true };
  }

  override async userCanCreate(
    session: UserSession,
    gameCreationRequest: GameCreationRequest
  ): Promise<AllowedResult> {
    if (!session.isAuth()) {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
    invariant(session.taggedUserId.type === UserIdType.Auth, ERROR_MESSAGES.AUTH.REQUIRED);

    // or if continuing a run, do they control a player in the run
    const { continueGameId } = gameCreationRequest;
    if (continueGameId) {
      const serializedRun =
        await this.userGameDataPersistenceService.requireIronmanRun(continueGameId);
      const run = SavedIronmanRun.fromSerialized(serializedRun);
      const userWasInThisRun = run.containsPlayerControlledByUser(session);
      if (!userWasInThisRun) {
        return { allowed: false, reason: ERROR_MESSAGES.GAME_SETUP.PLAYER_NOT_IN_CONTINUED_GAME };
      }

      // and is the run not live (this seems redundant since players can't start the game)
      // unless all are in the same game, so two players loading same instance of a game and starting it
      // should not be possible
      const gameAlreadyLive = await this.gameExistenceChecker.gameExistsById(continueGameId);
      if (gameAlreadyLive) {
        return { allowed: false, reason: ERROR_MESSAGES.GAME_SETUP.CONTINUED_GAME_ALREADY_LIVE };
      }
    } else {
      // check user account for open ironman slot for this control mode (for new runs)
      const profile = await this.profileService.fetchExpectedProfile(session.taggedUserId.id);
      const userAccountIsAtSavedRunCapacity =
        profile.ironmanRunIds.length >= profile.ironmanRunCapacity;
      if (userAccountIsAtSavedRunCapacity) {
        return { allowed: false, reason: ERROR_MESSAGES.USER.SAVED_GAME_CAPACITY };
      }
    }

    return { allowed: true };
  }

  override async createGame(
    session: UserSession,
    gameCreationRequest: GameCreationRequest
  ): Promise<SpeedDungeonGame> {
    const runIdOption = gameCreationRequest.continueGameId;
    if (runIdOption) {
      const serialized = await this.userGameDataPersistenceService.requireIronmanRun(runIdOption);
      return SavedIronmanRun.createGameFromSavedRun(serialized);
    } else {
      const { gameName, mode, controlScheme } = gameCreationRequest;
      return new SpeedDungeonGame(
        this.idGenerator.generate() as GameId,
        gameName,
        mode,
        controlScheme
      );
    }
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

  override async onJoin(
    session: UserSession,
    game: SpeedDungeonGame,
    partySetupController: PartySetupController
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    if (game.isContinuedRun) {
      const serializedRun = await this.userGameDataPersistenceService.requireIronmanRun(game.id);
      const run = SavedIronmanRun.fromSerialized(serializedRun);
      run.updatePlayerOnJoin(session);
    }
    return new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
  }

  override async onLeave(
    session: UserSession,
    game: SpeedDungeonGame
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    if (game.isContinuedRun) {
      // - else, mark their player as "awaitingControllingUserConnection"
      const player = game.getExpectedPlayer(session.username);
      player.awaitingControllingUserConnection = true;
    } else {
      // - if not a continued run setup, remove their characters
    }
    return undefined;
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
