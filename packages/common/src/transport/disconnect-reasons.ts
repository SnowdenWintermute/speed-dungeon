import SocketIO from "socket.io";

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

export const SOCKET_IO_DISCONNECT_REASONS: Record<
  SocketIO.DisconnectReason,
  TransportDisconnectReasonType
> = {
  "transport error": TransportDisconnectReasonType.TransportError,
  "transport close": TransportDisconnectReasonType.TransportClose,
  "forced close": TransportDisconnectReasonType.ForcedClose,
  "ping timeout": TransportDisconnectReasonType.PingTimeout,
  "parse error": TransportDisconnectReasonType.ParseError,
  "server shutting down": TransportDisconnectReasonType.ServerShuttingDown,
  "forced server close": TransportDisconnectReasonType.ForcedServerClose,
  "client namespace disconnect": TransportDisconnectReasonType.ClientNamespaceDisconnect,
  "server namespace disconnect": TransportDisconnectReasonType.ServerNamespaceDisconnect,
};
