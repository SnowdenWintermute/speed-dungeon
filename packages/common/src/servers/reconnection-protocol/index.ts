import { GameStateUpdate } from "../../packets/game-state-updates";
import { MessageDispatchOutbox } from "../update-delivery/outbox";

export enum ConnectionContextType {
  InitialConnection,
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
