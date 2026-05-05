import {
  CombatantId,
  ConnectionId,
  GameName,
  GuestSessionReconnectionToken,
  PartyName,
  Username,
} from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { ActionValidity } from "../../primatives/index.js";
import { CharacterAssociatedData } from "../../types.js";
import { invariant } from "../../utils/index.js";
import { GameRegistry } from "../game-registry.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { GlobalAuthGameSessionStore } from "../services/global-auth-game-connection-session-store/index.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import {
  ReconnectionKey,
  ReconnectionKeyType,
} from "../services/reconnection-forwarding-store/index.js";
import { ConnectionSession } from "./session-registry.js";
import { AuthTaggedUserId, TaggedUserId, UserIdType } from "./user-ids.js";
import { UserSessionRegistry } from "./user-session-registry.js";

export enum UserSessionConnectionState {
  Connected,
  Disconnected,
}

export class UserSession extends ConnectionSession {
  public currentGameName: null | GameName = null;
  public currentPartyName: null | PartyName = null;
  private guestReconnectionToken: null | GuestSessionReconnectionToken = null;
  // in the case of two connections disconnecting at the same time we will synchronously
  // set each one to disconnected such that we won't have an async race between each
  // disconnection handler trying to send a user disconnected message to each other but they
  // both are no longer registered endpoints
  private _connectionState = UserSessionConnectionState.Connected;
  // set to true when they leave game so we don't try to run reconnection logic
  public intentionallyClosed = false;

  constructor(
    private _username: Username,
    /** either a socket.id or a locally generated UUID on client */
    public readonly connectionId: ConnectionId,
    public readonly taggedUserId: TaggedUserId,
    private readonly gameRegistry: GameRegistry
  ) {
    super(connectionId);
  }

  get username() {
    return this._username;
  }

  set username(username: Username) {
    this._username = username;
  }

  get connectionState() {
    return this._connectionState;
  }

  set connectionState(newState: UserSessionConnectionState) {
    this._connectionState = newState;
  }

  getCurrentGameOption() {
    if (this.currentGameName === null) {
      return null;
    }
    return this.gameRegistry.getGameOption(this.currentGameName) || null;
  }

  getExpectedCurrentGame() {
    const currentGameOption = this.getCurrentGameOption();
    if (currentGameOption === null) {
      throw new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME);
    }
    return currentGameOption;
  }

  isInGame() {
    return this.currentGameName !== null;
  }

  isAuth() {
    return this.taggedUserId.type === UserIdType.Auth;
  }

  isGuest() {
    return this.taggedUserId.type === UserIdType.Guest;
  }

  getCurrentPartyOption(game: SpeedDungeonGame) {
    if (this.currentPartyName === null) {
      return null;
    }

    try {
      return game.getExpectedParty(this.currentPartyName);
    } catch {
      throw new Error("User session had a party name for a party that did not exist");
    }
  }

  getExpectedCurrentParty(game: SpeedDungeonGame) {
    if (this.currentPartyName === null) {
      throw new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
    }

    return game.getExpectedParty(this.currentPartyName);
  }

  canJoinNewGame(isRanked?: boolean): ActionValidity {
    if (this.isInGame()) {
      return new ActionValidity(false, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);
    }

    const userIsGuest = this.taggedUserId.type === UserIdType.Guest;
    if (isRanked && userIsGuest) {
      return new ActionValidity(false, ERROR_MESSAGES.AUTH.REQUIRED);
    }

    return new ActionValidity(true);
  }

  joinGame(game: SpeedDungeonGame) {
    this.currentGameName = game.name;
  }

  async requireNotInGameOnAnotherSession(
    lobbyUserSessionRegistry: UserSessionRegistry,
    globalAuthGameSessionStore: GlobalAuthGameSessionStore
  ) {
    // used to prevent loading the same saved character into multiple active games
    // or deleting a saved character that is in a game

    // check the local (lobby) for any session in a game
    const userLobbySessions = lobbyUserSessionRegistry.getExpectedUserSessions(
      this.taggedUserId.id
    );

    for (const otherSession of userLobbySessions) {
      if (otherSession.isInGame()) {
        throw new Error(ERROR_MESSAGES.LOBBY.USER_IN_GAME);
      }
    }

    let hasGameConnection = false;
    if (this.taggedUserId.type === UserIdType.Auth) {
      hasGameConnection = await globalAuthGameSessionStore.hasExistingSession(this.taggedUserId.id);
    }

    if (hasGameConnection) {
      throw new Error(ERROR_MESSAGES.LOBBY.USER_IN_GAME);
    }
  }

  // be careful with this! led to longer than-needed debug sesh
  requireAuthorized(): asserts this is { taggedUserId: AuthTaggedUserId } {
    if (this.taggedUserId.type !== UserIdType.Auth) {
      throw new Error(ERROR_MESSAGES.AUTH.REQUIRED);
    }
  }

  async requireProfile(profileService: SpeedDungeonProfileService) {
    this.requireAuthorized();
    const expectedProfile = await profileService.fetchExpectedProfile(this.taggedUserId.id);
    return expectedProfile;
  }

  setGuestReconnectionToken(token: GuestSessionReconnectionToken) {
    invariant(this.isGuest());
    this.guestReconnectionToken = token;
  }

  getGuestReconnectionTokenOption() {
    return this.guestReconnectionToken;
  }

  getReconnectionKeyOption(): null | ReconnectionKey {
    switch (this.taggedUserId.type) {
      case UserIdType.Auth: {
        return {
          type: ReconnectionKeyType.Auth,
          userId: this.taggedUserId.id,
        };
      }
      case UserIdType.Guest: {
        const reconnectionTokenOption = this.getGuestReconnectionTokenOption();

        if (!reconnectionTokenOption) {
          return null;
        }

        return {
          type: ReconnectionKeyType.Guest,
          reconnectionToken: reconnectionTokenOption,
        };
      }
    }
  }

  requireReconnectionKey() {
    const key = this.getReconnectionKeyOption();
    invariant(key !== null, "expected reconnection key not found");
    return key;
  }

  requirePlayerContext() {
    const game = this.getExpectedCurrentGame();
    const player = game.getExpectedPlayer(this.username);
    const party = this.getExpectedCurrentParty(game);

    return { game, party, player };
  }

  requireCharacterContext(
    characterId: CombatantId,
    options: { requireOwned?: boolean; requireAlive?: boolean; requireInputsUnlocked?: boolean } = {
      requireOwned: true,
      requireAlive: true,
      requireInputsUnlocked: true,
    }
  ): CharacterAssociatedData {
    const { game, party, player } = this.requirePlayerContext();
    const character = party.combatantManager.getExpectedCombatant(characterId);

    if (options.requireInputsUnlocked) {
      game.requireInputUnlocked();
      game.requireTimeStarted();
      party.requireInputUnlocked();
    }

    if (options.requireOwned) {
      character.combatantProperties.controlledBy.requireOwnedBy(this.username);
    }

    if (options.requireAlive) {
      character.combatantProperties.requireAlive();
    }

    return { game, party, player, character };
  }
}
