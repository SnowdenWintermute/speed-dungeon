import { ConnectionId, UntypedEndpointBrand } from "../aliases.js";
import { UntypedConnectionEndpoint } from "./connection-endpoint.js";

export class UntypedInMemoryConnectionEndpoint extends UntypedConnectionEndpoint {
  private subscribeAllHandler: ((message: unknown) => void) | null = null;

  readonly [UntypedEndpointBrand] = true;

  constructor(
    public readonly id: ConnectionId,
    /**
      ask the transport to deliver this message as someone’s inbound. Basically they will
      call receive on their paired endpoint, but they don't know that explicitly. Analogous to socket.emit
    * */
    private readonly deliverInbound: (message: unknown) => void,
    private readonly onClose: () => void
  ) {
    super();
  }

  // analogous to socket.emit
  send(message: unknown): void {
    this.deliverInbound(message);
  }

  // analogous to socket.on("someEventWeAgreeOn", (data)=>void)
  subscribeAll(handler: (message: unknown) => void): void {
    this.subscribeAllHandler = handler;
  }

  // analogous to having the "someEventWeAgreeOn" subscribed event fire
  receive(message: unknown): void {
    this.subscribeAllHandler?.(message);
  }

  close(): void {
    this.onClose();
  }
}
