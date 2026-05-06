import {
  CrossServerBroadcast,
  CrossServerBroadcastHandler,
  CrossServerBroadcasterService,
} from "./index.js";

// Shared bus that multiple in-process server instances point at, so a publish
// on one is delivered to every other server's subscriber. Mirrors how Valkey
// would relay between separate processes in production.
export class InMemoryCrossServerBroadcastBus<TPayload, TCommand> {
  private handlers = new Set<CrossServerBroadcastHandler<TPayload, TCommand>>();

  register(handler: CrossServerBroadcastHandler<TPayload, TCommand>): void {
    this.handlers.add(handler);
  }

  unregister(handler: CrossServerBroadcastHandler<TPayload, TCommand>): void {
    this.handlers.delete(handler);
  }

  deliver(broadcast: CrossServerBroadcast<TPayload, TCommand>): void {
    for (const handler of this.handlers) handler(broadcast);
  }
}

export class InMemoryCrossServerBroadcaster<TPayload, TCommand>
  implements CrossServerBroadcasterService<TPayload, TCommand>
{
  private ownHandler: CrossServerBroadcastHandler<TPayload, TCommand> | null = null;

  constructor(private readonly bus: InMemoryCrossServerBroadcastBus<TPayload, TCommand>) {}

  async publish(broadcast: CrossServerBroadcast<TPayload, TCommand>): Promise<void> {
    this.bus.deliver(broadcast);
  }

  async subscribe(handler: CrossServerBroadcastHandler<TPayload, TCommand>): Promise<void> {
    if (this.ownHandler !== null)
      throw new Error("CrossServerBroadcaster already has a subscriber");
    this.ownHandler = handler;
    this.bus.register(handler);
  }

  async disconnect(): Promise<void> {
    if (this.ownHandler === null) return;
    this.bus.unregister(this.ownHandler);
    this.ownHandler = null;
  }
}
