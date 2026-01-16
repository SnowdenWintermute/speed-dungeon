import { ConnectionId, UntypedEndpointBrand } from "../aliases.js";
import { UntypedConnectionEndpoint } from "./connection-endpoint.js";
import { SOCKET_IO_DISCONNECT_REASONS, TransportDisconnectReason } from "./disconnect-reasons.js";
import SocketIO from "socket.io";

// abstract the client and server versions of socket.io socket object
export interface MessageSocket {
  readonly id: string;
  emit(event: string, payload: unknown): void;
  on(event: string, handler: (payload: unknown) => void): void;
  disconnect(): void;
}

export class UntypedSocketConnectionEndpoint extends UntypedConnectionEndpoint {
  static UniversalMessageEventName = "message";
  readonly id: ConnectionId;
  constructor(readonly socket: MessageSocket) {
    super();
    this.id = socket.id as ConnectionId;
  }
  readonly [UntypedEndpointBrand] = true;

  send(payload: unknown): void {
    this.socket.emit(UntypedSocketConnectionEndpoint.UniversalMessageEventName, payload);
  }
  receive(payload: unknown): void {
    throw new Error(
      "Socket based endpoints should not directly call receive. They should receive via socket.io when their paired endpoint emits."
    );
  }
  subscribeAll(
    messageHandler: (payload: unknown) => void,
    disconnectHandler: (payload: TransportDisconnectReason) => void
  ): void {
    this.socket.on(UntypedSocketConnectionEndpoint.UniversalMessageEventName, (data) =>
      messageHandler(data)
    );
    this.socket.on("disconnect", (socketIoTransportCloseString) => {
      const type =
        SOCKET_IO_DISCONNECT_REASONS[socketIoTransportCloseString as SocketIO.DisconnectReason];
      const reason = new TransportDisconnectReason(type);
      disconnectHandler(reason);
    });
  }
  close(): void {
    this.socket.disconnect();
  }
}
