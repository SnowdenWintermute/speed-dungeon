import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export enum ConnectionContextType {
  InitialConnection,
  GameServerReconnection,
  GameServerSessionPreemption,
  WillForwardToGameServer,
}

export const CONNECTION_CONTEXT_TYPE_STRINGS: Record<ConnectionContextType, string> = {
  [ConnectionContextType.InitialConnection]: "InitialConnection",
  [ConnectionContextType.GameServerReconnection]: "GameServerReconnection",
  [ConnectionContextType.GameServerSessionPreemption]: "GameServerSessionPreemption",
  [ConnectionContextType.WillForwardToGameServer]: "WillForwardToGameServer",
};

export interface ConnectionContext {
  type: ConnectionContextType;
}

export interface PlayerReconnectionProtocol {
  evaluateConnectionContext(...args: any[]): Promise<ConnectionContext>;
  onPlayerDisconnected(...args: any[]): Promise<MessageDispatchOutbox<GameStateUpdate>>;
  // issueReconnectionCredential(...args: any[]): Promise<MessageDispatchOutbox<GameStateUpdate>>;
  attemptReconnectionClaim(...args: any[]): Promise<void>;
}
