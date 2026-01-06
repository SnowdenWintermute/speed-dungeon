import { ConnectionId } from "../../aliases.js";
import { ConnectionSession, SessionRegistry } from "../sessions/session-registry.js";
import {
  MessageDispatchFactory,
  MessageDispatchType,
} from "../update-delivery/message-dispatch-factory.js";
import { OutgoingMessageGateway } from "../update-delivery/message-gateway.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

type IncomingMessageHandler<
  M extends Record<PropertyKey, unknown>,
  Session extends ConnectionSession,
> = {
  [K in keyof M]: (
    data: M[K],
    session: Session
  ) => MessageDispatchOutbox<any> | Promise<MessageDispatchOutbox<any>>;
};

export abstract class ConnectionDomain<
  Sendable extends { type: PropertyKey; data: unknown },
  Receivable extends { type: PropertyKey; data: unknown },
  IncomingMessageHandlerMap extends Record<PropertyKey, unknown>,
  Session extends ConnectionSession,
> {
  // private messageHandlers
  abstract sessionRegistry: SessionRegistry<Session>;

  protected abstract readonly messageHandlers: Partial<
    IncomingMessageHandler<IncomingMessageHandlerMap, Session>
  >;

  private readonly outgoingMessageGateway = new OutgoingMessageGateway<Sendable, Receivable>();
  abstract messageDispatchFactory: MessageDispatchFactory<Sendable>;

  // disconnectionHandler

  // calls controller for each message and dispatches the messages they return in their outboxes
  protected async handleIncomingMessage(incomingMessage: Receivable, connectionId: ConnectionId) {
    const handlerOption = this.messageHandlers[incomingMessage.type];
    if (handlerOption === undefined) {
      throw new Error(`Unhandled message type: ${String(incomingMessage.type)}`);
    }

    const fromSession = this.sessionRegistry.getExpectedSession(connectionId);
    // a workaround is to use "as never" for some reason
    const outbox = await handlerOption(incomingMessage.data as never, fromSession);
    this.dispatchOutboxMessages(outbox);
  }

  protected dispatchOutboxMessages(outbox: MessageDispatchOutbox<Sendable>) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case MessageDispatchType.Single:
          this.outgoingMessageGateway.submitToConnection(dispatch.connectionId, dispatch.message);
          break;
        case MessageDispatchType.FanOut:
          this.outgoingMessageGateway.submitToConnections(dispatch.connectionIds, dispatch.message);
          break;
      }
    }
  }
}

// on connection
// - put connection endpoint id in a pendingHandshakes: Map<ConnectionId, ConnectionEndpoint>
//
// on handshake packet
// - determine type of client (user or game server)
// - call appropriate handleHandshake

// connection domains
//
// usersManager | gameServersManager
// handle handshake - verify connector's identity (guest user, auth user, trusted game server)
// store sessions
// contain controller subsystems with handlers corresponding to typed messages
// handle client packets -> create outboxes
// submit outbox dispatches to connections
// handle disconnections
