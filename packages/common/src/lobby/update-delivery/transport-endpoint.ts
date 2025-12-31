import { ConnectionId } from "../../aliases.js";

// unused, why did we make this
type EventEnvelope<TType extends PropertyKey, TData> = {
  type: TType;
  data: TData;
};

export interface TransportEndpoint<
  Sendable,
  Receivable extends { type: PropertyKey; data: unknown },
> {
  readonly id: ConnectionId;
  send(update: Sendable): void;
  subscribe<K extends Receivable["type"]>(
    type: K,
    handler: (payload: Extract<Receivable, { type: K }>["data"]) => void
  ): void;
  close?(): void;
}

export class LocalTransportEndpoint<
  Sendable,
  Receivable extends { type: PropertyKey; data: unknown },
> implements TransportEndpoint<Sendable, Receivable>
{
  private handlers = new Map<Receivable["type"], (payload: Receivable["data"]) => void>();

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

  // subscribe(event: Receivable["type"], handler: (payload: Receivable["data"]) => void): void {
  //   this.handlers.set(event, handler);
  // }

  subscribe<K extends Receivable["type"]>(
    type: K,
    handler: (payload: Extract<Receivable, { type: K }>["data"]) => void
  ): void {
    this.handlers.set(type, handler as (payload: unknown) => void);
  }

  receive(message: Receivable): void {
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
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
