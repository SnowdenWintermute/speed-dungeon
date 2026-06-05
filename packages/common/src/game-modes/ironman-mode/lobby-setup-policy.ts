import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantId, GameId, IdentityProviderId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameCreationRequest } from "../../packets/client-intents.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { AllowedResult } from "../../primatives/index.js";
import { PartySetupController } from "../../servers/lobby-server/controllers/party-setup.js";
import { SavedIronmanRun } from "../../servers/services/user-game-data-persistence/saved-ironman-runs.js";
import { UserIdType } from "../../servers/sessions/user-ids.js";
import { UserSession } from "../../servers/sessions/user-session.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { invariant } from "../../utils/index.js";
import { CharacterControlScheme, getMaxCharacterCountForControlScheme } from "../index.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class IronmanModeLobbySetup extends GameModeLobbySetupPolicy {
  override async modeSpecificStartRequirementsMet(game: SpeedDungeonGame): Promise<AllowedResult> {
    if (game.isContinuedRun) {
      for (const [_, player] of game.players) {
        if (player.awaitingControllingUserConnection) {
          return {
            allowed: false,
            reason: ERROR_MESSAGES.GAME_SETUP.AWAITING_PLAYER_FOR_CONTINUED_GAME,
          };
        }
      }
    }

    return { allowed: true };
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

    const { continueGameId } = gameCreationRequest;
    if (continueGameId) {
      return await this.userCanCreateContinuedRun(session, continueGameId);
    } else {
      return this.userCanCreateNewRun(session.taggedUserId.id);
    }
  }

  private async userCanCreateContinuedRun(
    session: UserSession,
    runId: GameId
  ): Promise<AllowedResult> {
    const serializedRun = await this.userGameDataPersistenceService.requireIronmanRun(runId);
    const run = SavedIronmanRun.fromSerialized(serializedRun);
    const userWasInThisRun = run.containsPlayerControlledByUser(session);
    if (!userWasInThisRun) {
      return { allowed: false, reason: ERROR_MESSAGES.GAME_SETUP.PLAYER_NOT_IN_CONTINUED_GAME };
    }

    // since players can't start the game unless all are in the same game, this should not be possible
    const gameNotAlreadyLive = !(await this.gameExistenceChecker.gameExistsById(runId));
    invariant(gameNotAlreadyLive, ERROR_MESSAGES.GAME_SETUP.CONTINUED_GAME_ALREADY_LIVE);

    return { allowed: true };
  }

  private async userCanCreateNewRun(userId: IdentityProviderId): Promise<AllowedResult> {
    const profile = await this.profileService.fetchExpectedProfile(userId);
    const { ironmanRunIds, ironmanRunCapacity } = profile;
    const userAccountIsAtSavedRunCapacity = ironmanRunIds.length >= ironmanRunCapacity;

    if (userAccountIsAtSavedRunCapacity) {
      return { allowed: false, reason: ERROR_MESSAGES.USER.SAVED_GAME_CAPACITY };
    } else {
      return { allowed: true };
    }
  }

  override async createGame(gameCreationRequest: GameCreationRequest): Promise<SpeedDungeonGame> {
    const runIdOption = gameCreationRequest.continueGameId;
    if (runIdOption) {
      const serialized = await this.userGameDataPersistenceService.requireIronmanRun(runIdOption);
      const game = SavedIronmanRun.createGameFromSavedRun(serialized);
      return game;
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

  override getMaxStartingFloor() {
    return 1;
  }

  override onCreation(game: SpeedDungeonGame): void {
    if (!game.isContinuedRun) {
      this.createDefaultPartyInGame(game);
    }
  }

  override async onJoin(
    session: UserSession,
    game: SpeedDungeonGame,
    partySetupController: PartySetupController
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    if (game.isContinuedRun) {
      const serializedRun = await this.userGameDataPersistenceService.requireIronmanRun(game.id);
      const run = SavedIronmanRun.fromSerialized(serializedRun);
      const playerNameUpdateOption = run.updatePlayerOnJoin(session);
      const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
      if (playerNameUpdateOption) {
        outbox.pushToChannel(game.getChannelName(), {
          type: GameStateUpdateType.PlayerUsernameUpdated,
          data: playerNameUpdateOption,
        });
      }

      const player = game.getExpectedPlayer(session.username);
      player.awaitingControllingUserConnection = false;

      return outbox;
    } else {
      const defaultPartyName = this.getDefaultPartyName(game.name);
      return partySetupController.joinPartyHandler(session, defaultPartyName);
    }
  }

  override async onLeave(
    session: UserSession,
    game: SpeedDungeonGame,
    partySetupController: PartySetupController
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined> {
    if (game.isContinuedRun) {
      // unlike normal games, we don't want to clean up their player object and
      // characters because when continuing a saved run we expect all the original
      // players to be present
      const player = game.getExpectedPlayer(session.username);
      player.awaitingControllingUserConnection = true;
    } else {
      return this.genericGameModePolicyOnLeave(session, game, partySetupController);
    }
  }

  override async userCanCreateCharacter(
    session: UserSession,
    game: SpeedDungeonGame
  ): Promise<AllowedResult> {
    if (game.isContinuedRun) {
      return { allowed: false, reason: ERROR_MESSAGES.GAME_SETUP.CONTINUED_GAME };
    }
    return { allowed: true };
  }

  override userCanAddCharacterToParty(
    _session: UserSession,
    game: SpeedDungeonGame,
    _party: AdventuringParty
  ): AllowedResult {
    if (game.isContinuedRun) {
      return { allowed: false, reason: ERROR_MESSAGES.GAME_SETUP.CONTINUED_GAME };
    }

    return { allowed: true };
  }

  override async getSelectableCharacterIds(): Promise<CombatantId[]> {
    return [];
  }
}
