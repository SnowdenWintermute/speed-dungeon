import { GameStateUpdate } from "../../../packets/game-state-updates.js";
import {
  ConnectionContextType,
  PlayerReconnectionProtocol,
} from "../../reconnection-protocol/index.js";
import { ConnectionIdentityResolutionContext } from "../../services/identity-provider.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";

interface GameServerReconnectionContext {
  type: ConnectionContextType.Reconnection;
  issueCredentials: () => Promise<MessageDispatchOutbox<GameStateUpdate>>;
}

interface GameServerInitialConnectionContext {
  type: ConnectionContextType.InitialConnection;
}

export type GameServerConnectionContext =
  | GameServerReconnectionContext
  | GameServerInitialConnectionContext;

export class GameServerReconnectionProtocol implements PlayerReconnectionProtocol {
  constructor() {
    // private readonly disconnectedSessionStoreService: DisconnectedSessionStoreService // private readonly gameSessionStoreService: GameSessionStoreService, // private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>, // private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec,
    //
  }

  async evaluateConnectionContext(
    session: UserSession,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ): Promise<GameServerConnectionContext> {
    //
    throw new Error("Method not implemented.");
  }

  async issueReconnectionCredential(
    session: UserSession
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    throw new Error("Method not implemented.");
  }

  onPlayerDisconnected(...args: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  attemptReconnectionClaim(...args: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
