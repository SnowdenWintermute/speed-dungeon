import { GameServerName } from "../../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import {
  ConnectionContextType,
  PlayerReconnectionProtocol,
} from "../../reconnection-protocol/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { GameServerReconnectionForwardingRecord } from "../../services/reconnection-forwarding-store/game-server-reconnection-forwarding-record.js";
import { ReconnectionForwardingStoreService } from "../../services/reconnection-forwarding-store/index.js";
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
    private readonly reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
    private readonly gameServerUrlRegistry: Record<GameServerName, string>
  ) {}

  async evaluateConnectionContext(session: UserSession): Promise<LobbyConnectionContext> {
    // we will rely on the game server to delete the reconnectionForwardingRecord when it is claimed or expires
    // in the event that it expires after we issue the claim token and before the user presents it, we will
    // not accept their reconnection to the game server. the reason I didn't want to delete it here is because
    // the game server needs to know when the reconnectionForwardingRecord expires or is claimed so it can remove the
    // input lock's RC for that user in the game. also, if they get their claim token then disconnect before
    // reconnecting to the game server they won't be able to reconnect again if we delete it now.
    console.log("about to get reconnectionForwardingRecordOption");
    const reconnectionForwardingRecordOption =
      await this.getGameServerReconnectionForwardingRecordOption(session);

    if (!reconnectionForwardingRecordOption) {
      console.log("no forwarding record");
      return { type: ConnectionContextType.InitialConnection };
    }

    console.log("try get gameStillExists");
    const gameStillExists = await this.gameSessionStoreService.getActiveGameStatus(
      reconnectionForwardingRecordOption.gameName
    );
    console.log("gameStillExists", gameStillExists);
    if (!gameStillExists) {
      return { type: ConnectionContextType.InitialConnection };
    }

    return {
      type: ConnectionContextType.Reconnection,
      issueCredentials: async () =>
        await this.issueReconnectionCredential(session, reconnectionForwardingRecordOption),
    };
  }

  async issueReconnectionCredential(
    session: UserSession,
    reconnectionForwardingRecord: GameServerReconnectionForwardingRecord
  ) {
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    const claimToken = new GameServerSessionClaimToken(
      reconnectionForwardingRecord.gameName,
      reconnectionForwardingRecord.partyName,
      session.username,
      reconnectionForwardingRecord.taggedUserId,
      reconnectionForwardingRecord.guestUserReconnectionTokenOption || undefined
    );

    console.log("about to encode token");
    let encryptedSessionClaimToken = "";
    try {
      encryptedSessionClaimToken = await this.gameServerSessionClaimTokenCodec.encode(claimToken);
    } catch (err) {
      console.log("error encrypting token", err);
    }

    const url = this.getGameServerUrlFromName(reconnectionForwardingRecord.gameServerName);
    console.log("game server url:", url);

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
    // console.info(
    //   `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) was given instructions to reconnect to server ${reconnectionForwardingRecord.gameServerName} at url ${url}`
    // );

    return outbox;
  }

  onPlayerDisconnected(...args: any[]): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    throw new Error("Method not implemented.");
  }

  private getGameServerUrlFromName(name: GameServerName) {
    const urlOption = this.gameServerUrlRegistry[name];
    if (urlOption === undefined) {
      throw new Error("No game server url found by that name");
    }
    return urlOption;
  }

  attemptReconnectionClaim(...args: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private async getGameServerReconnectionForwardingRecordOption(session: UserSession) {
    const reconnectionKey = session.getReconnectionKeyOption();
    console.log("reconnectionKey:", reconnectionKey);
    if (reconnectionKey) {
      return await this.reconnectionForwardingStoreService.getGameServerReconnectionForwardingRecord(
        reconnectionKey
      );
    } else {
      console.log("getGameServerReconnectionForwardingRecordOption no reconnection key");
    }
  }
  // async evaluateAdmission(attempt: ReconnectionAttempt): Promise<LobbyAdmissionDecision>;
}
