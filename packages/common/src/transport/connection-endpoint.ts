import { ConnectionId, UntypedEndpointBrand } from "../aliases.js";
import { TransportDisconnectReason } from "./disconnect-reasons.js";

export interface ConnectionEndpoint<Sendable, Receivable> {
  readonly id: ConnectionId;
  send(update: Sendable): void;
  receive(message: Receivable): void;
  subscribeAll(
    handler: (message: Receivable) => void,
    disconnectHandler: (payload: TransportDisconnectReason) => Promise<void>
  ): void;
  close(): void;
  // otherwise we were able to pass untyped endpoints as arguments that expected typed endpoints
  readonly [UntypedEndpointBrand]?: never;
}

export abstract class UntypedConnectionEndpoint {
  // @TODO - make it so we cannot call these methods until transformed into a typed endpoint
  abstract readonly id: ConnectionId;
  protected abstract send(payload: unknown): void;
  protected abstract receive(payload: unknown): void;
  protected abstract subscribeAll(
    messageHandler: (payload: unknown) => void,
    disconnectHandler: (payload: unknown) => Promise<void>
  ): void;
  protected abstract close(): void;
  abstract readonly [UntypedEndpointBrand]: true;

  toTyped<Sendable, Receivable>(): ConnectionEndpoint<Sendable, Receivable> {
    const untyped = this;

    return {
      id: untyped.id,
      send(message: Sendable) {
        untyped.send(message);
      },
      receive(message: Receivable) {
        untyped.receive?.(message);
      },
      subscribeAll(handler: (message: Receivable) => void) {
        untyped.subscribeAll(
          (payload) => handler(payload as Receivable),
          async () => untyped.close()
        );
      },
      close() {
        untyped.close();
      },
    };
  }
}
