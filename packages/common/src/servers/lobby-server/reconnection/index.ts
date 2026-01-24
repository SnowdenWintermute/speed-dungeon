import { GameServerName } from "../../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import {
  ConnectionContextType,
  PlayerReconnectionProtocol,
} from "../../reconnection-protocol/index.js";
import { ReconnectionForwardingStoreService } from "../../services/disconnected-session-store/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { ConnectionIdentityResolutionContext } from "../../services/identity-provider.js";
import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import {
  GameServerSessionClaimToken,
  GameServerSessionClaimTokenCodec,
} from "../game-handoff/session-claim-token.js";

interface LobbyReconnectionContext {
  type: ConnectionContextType.Reconnection;
  issueCredentials: () => Promise<MessageDispatchOutbox<GameStateUpdate>>;
}

interface LobbyInitialConnectionContext {
  type: ConnectionContextType.InitialConnection;
}

export type LobbyConnectionContext = LobbyReconnectionContext | LobbyInitialConnectionContext;

export class LobbyReconnectionProtocol implements PlayerReconnectionProtocol {
  constructor(
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly gameSessionStoreService: GameSessionStoreService,
    private readonly reconnectionForwardingStoreService: ReconnectionForwardingStoreService
  ) {}

  async evaluateConnectionContext(session: UserSession): Promise<LobbyConnectionContext> {
    // we will rely on the game server to delete the disconnectedSession when it is claimed or expires
    // in the event that it expires after we issue the claim token and before the user presents it, we will
    // not accept their reconnection to the game server. the reason I didn't want to delete it here is because
    // the game server needs to know when the disconnectedSession expires or is claimed so it can remove the
    // input lock's RC for that user in the game. also, if they get their claim token then disconnect before
    // reconnecting to the game server they won't be able to reconnect again if we delete it now.
    const disconnectedSessionOption = await this.getDisconnectedSessionOption(session);
    if (!disconnectedSessionOption) {
      return { type: ConnectionContextType.InitialConnection };
    }

    const gameStillExists = await this.gameSessionStoreService.getActiveGameStatus(
      disconnectedSessionOption.gameName
    );
    if (!gameStillExists) {
      return { type: ConnectionContextType.InitialConnection };
    }

    return {
      type: ConnectionContextType.Reconnection,
      issueCredentials: async () =>
        await this.issueReconnectionCredential(session, disconnectedSessionOption),
    };
  }

  async issueReconnectionCredential(
    session: UserSession,
    disconnectedSession: DisconnectedSession
  ) {
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    const claimToken = new GameServerSessionClaimToken(
      disconnectedSession.gameName,
      disconnectedSession.partyName,
      session.username,
      disconnectedSession.taggedUserId,
      disconnectedSession.guestUserReconnectionTokenOption || undefined
    );

    const encryptedSessionClaimToken =
      await this.gameServerSessionClaimTokenCodec.encode(claimToken);

    const url = this.getGameServerUrlFromName(disconnectedSession.gameServerName);

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameServerConnectionInstructions,
      data: {
        connectionInstructions: {
          url,
          encryptedSessionClaimToken,
        },
      },
    });

    const { username, taggedUserId, connectionId } = session;
    console.info(
      `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) was given instructions to reconnect to server ${disconnectedSession.gameServerName} at url ${url}`
    );

    return outbox;
  }

  onPlayerDisconnected(...args: any[]): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    throw new Error("Method not implemented.");
  }

  private getGameServerUrlFromName(name: GameServerName) {
    return "";
  }

  attemptReconnectionClaim(...args: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private async getDisconnectedSessionOption(session: UserSession) {
    const reconnectionKey = session.getReconnectionKeyOption();
    if (reconnectionKey) {
      return await this.reconnectionForwardingStoreService.getDisconnectedSession(reconnectionKey);
    }
  }
  // async evaluateAdmission(attempt: ReconnectionAttempt): Promise<LobbyAdmissionDecision>;
}
