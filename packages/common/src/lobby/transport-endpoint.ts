import { GameStateUpdate } from "../packets/game-state-updates.js";
import { ConnectionId } from "../types.js";

export interface TransportEndpoint {
  readonly id: ConnectionId;
  send(update: GameStateUpdate): void;
  close?(): void;
}

export enum TransportDisconnectReasonType {
  TransportError,
  TransportClose,
  ForcedClose,
  PingTimeout,
  ParseError,
  ServerShuttingDown,
  ForcedServerClose,
  ClientNamespaceDisconnect,
  ServerNamespaceDisconnect,
}

const TRANSPORT_DISCONNECT_REASON_TYPE_STRINGS: Record<TransportDisconnectReasonType, string> = {
  [TransportDisconnectReasonType.TransportError]: "TransportError",
  [TransportDisconnectReasonType.TransportClose]: "TransportClose",
  [TransportDisconnectReasonType.ForcedClose]: "ForcedClose",
  [TransportDisconnectReasonType.PingTimeout]: "PingTimeout",
  [TransportDisconnectReasonType.ParseError]: "ParseError",
  [TransportDisconnectReasonType.ServerShuttingDown]: "ServerShuttingDown",
  [TransportDisconnectReasonType.ForcedServerClose]: "ForcedServerClose",
  [TransportDisconnectReasonType.ClientNamespaceDisconnect]: "ClientNamespaceDisconnect",
  [TransportDisconnectReasonType.ServerNamespaceDisconnect]: "ServerNamespaceDisconnect",
};

export class TransportDisconnectReason {
  constructor(public readonly type: TransportDisconnectReasonType) {}

  getStringName() {
    return TRANSPORT_DISCONNECT_REASON_TYPE_STRINGS[this.type];
  }
}
