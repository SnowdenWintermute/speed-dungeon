import { GameServerName } from "../../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import {
  ConnectionContextType,
  PlayerReconnectionProtocol,
} from "../../reconnection-protocol/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { GlobalGameSessionStore } from "../../services/global-auth-game-connection-session-store/index.js";
import { GameSessionConnectionStatus } from "../../sessions/global-auth-game-session.js";
import { UserIdType } from "../../sessions/user-ids.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import {
  GameServerSessionClaimToken,
  OpaqueEncryptionTokenCodec,
} from "../game-handoff/session-claim-token.js";

interface LobbyForwardToGameServerConnectionContext {
  type: ConnectionContextType.WillForwardToGameServer;
  issueCredentials: () => Promise<MessageDispatchOutbox<GameStateUpdate>>;
}

interface LobbyInitialConnectionContext {
  type: ConnectionContextType.InitialConnection;
}

export type LobbyConnectionContext =
  | LobbyForwardToGameServerConnectionContext
  | LobbyInitialConnectionContext;

export class LobbyReconnectionProtocol implements PlayerReconnectionProtocol {
  constructor(
    private readonly gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly gameSessionStoreService: GameSessionStoreService,
    private readonly globalGameSessionStore: GlobalGameSessionStore,
    private readonly gameServerUrlRegistry: Record<GameServerName, string>
  ) {}

  async evaluateConnectionContext(session: UserSession): Promise<LobbyConnectionContext> {
    const globalSessionOption = await this.getGlobalGameSessionOption(session);
    if (!globalSessionOption) {
      return { type: ConnectionContextType.InitialConnection };
    }
    const activeGameStatusOption = await this.gameSessionStoreService.getActiveGameStatus(
      globalSessionOption.gameId
    );
    let gameStillExists = !!activeGameStatusOption;
    // in the rare event that someone disconnected right after readying up and the pending game
    // was created before they had a chance to connect
    if (!gameStillExists) {
      const pendingGameOption = await this.gameSessionStoreService.getPendingGameSetup(
        globalSessionOption.gameId
      );
      gameStillExists = !!pendingGameOption;
    }

    if (!gameStillExists) {
      return { type: ConnectionContextType.InitialConnection };
    }
    const token = globalSessionOption.createClaimToken(this);

    return {
      type: ConnectionContextType.WillForwardToGameServer,
      issueCredentials: async () => await this.issueGameServerConnectionCredential(session, token),
    };
  }

  private async getGlobalGameSessionOption(session: UserSession) {
    switch (session.taggedUserId.type) {
      case UserIdType.Auth: {
        return await this.globalGameSessionStore.getSessionOption(session.taggedUserId);
      }
      case UserIdType.Guest: {
        // on guest user connection to lobby
        // if no GuestReconnectionToken, connect as normal
        const guestReconnectionTokenOption = session.getGuestReconnectionTokenOption();
        if (!guestReconnectionTokenOption) {
          return undefined;
        }
        // else, look up their GlobalUserSession by decrypting the saved GuestUserId from their reconnection token
        const globalSessionOption = await this.globalGameSessionStore.getSessionOption({
          type: UserIdType.Guest,
          id: guestReconnectionTokenOption.guestUserId,
        });
        // if no GlobalUserSession matches their token, token is considered expired - connect as normal
        // expect to find "AwaitingReconnection", the only valid state for a Guest's GlobalUserSession on new lobby connection
        // if state is otherwise, connect as fresh guest
        //  - it is possible a guest user opens another tab, uses LocalStorage saved reconnection token while they are still in game
        //    so they would see GlobalUserSession as "InGame" so we should ignore the token in that case
        if (
          !globalSessionOption ||
          globalSessionOption.connectionStatus !== GameSessionConnectionStatus.AwaitingReconnection
        ) {
          return undefined;
        }
        return globalSessionOption;
      }
    }
  }

  async issueGameServerConnectionCredential(
    session: UserSession,
    token: GameServerSessionClaimToken
  ) {
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);

    let encryptedSessionClaimToken = "";
    try {
      encryptedSessionClaimToken = await this.gameServerSessionClaimTokenCodec.encode(token);
    } catch (err) {
      console.trace("error encrypting token", err);
    }

    const url = token.gameServerUrl;

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameServerConnectionInstructions,
      data: {
        connectionInstructions: {
          url,
          encryptedSessionClaimToken,
        },
      },
    });

    return outbox;
  }

  onPlayerDisconnected(...args: any[]): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    throw new Error("Method not implemented.");
  }

  getGameServerUrlFromName(name: GameServerName) {
    const urlOption = this.gameServerUrlRegistry[name];
    if (urlOption === undefined) {
      throw new Error("No game server url found by that name");
    }
    return urlOption;
  }

  attemptReconnectionClaim(...args: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
