import { ConnectionId } from "../../aliases.js";

export interface TransportEndpoint<
  Sendable,
  Receivable extends { type: PropertyKey; data: unknown },
> {
  readonly id: ConnectionId;
  send(update: Sendable): void;
  receive?(message: Receivable): void;
  close?(): void;
}

export class LocalTransportEndpoint<
  Sendable,
  Receivable extends { type: PropertyKey; data: unknown },
> implements TransportEndpoint<Sendable, Receivable>
{
  private subscribeAllHandler: ((message: Receivable) => void) | null = null;

  constructor(
    public readonly id: ConnectionId,
    /**
      ask the transport to deliver this message as someone’s inbound. Basically they will
      call receive on their paired endpoint, but they don't know that explicitly
    * */
    private readonly deliverInbound: (message: Sendable) => void,
    private readonly onClose: () => void
  ) {}

  send(message: Sendable): void {
    this.deliverInbound(message);
  }

  subscribeAll(handler: (message: Receivable) => void): void {
    this.subscribeAllHandler = handler;
  }

  receive(message: Receivable): void {
    this.subscribeAllHandler?.(message);
  }

  close(): void {
    this.onClose();
  }
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
