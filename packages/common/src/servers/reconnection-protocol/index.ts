import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export enum ConnectionContextType {
  InitialConnection,
  InitialGameServerConnectionRetry,
  Reconnection,
}

export interface ConnectionContext {
  type: ConnectionContextType;
}

export interface PlayerReconnectionProtocol {
  evaluateConnectionContext(...args: any[]): Promise<ConnectionContext>;
  onPlayerDisconnected(...args: any[]): Promise<MessageDispatchOutbox<GameStateUpdate>>;
  issueReconnectionCredential(...args: any[]): Promise<MessageDispatchOutbox<GameStateUpdate>>;
  attemptReconnectionClaim(...args: any[]): Promise<void>;
}
