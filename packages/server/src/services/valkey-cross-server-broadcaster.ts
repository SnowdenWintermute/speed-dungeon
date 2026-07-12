import {
  CrossServerBroadcast,
  CrossServerBroadcastHandler,
  CrossServerBroadcasterService,
} from "@speed-dungeon/common";
import { RedisClientType } from "redis";

export const DEFAULT_CROSS_SERVER_BROADCAST_CHANNEL = "cross-server-broadcast";

export class ValkeyCrossServerBroadcaster<TPayload, TCommand>
  implements CrossServerBroadcasterService<TPayload, TCommand>
{
  // subscribing locks a redis connection into subscriber mode, so the subscriber
  // must be a dedicated connection separate from the shared publisher client
  private subscriberClient: RedisClientType | null = null;

  constructor(
    private readonly publisherClient: RedisClientType,
    // injectable so parallel tests can isolate their pub/sub traffic;
    // redis channels are not namespaced by the ValkeyManager key prefix
    private readonly channel: string = DEFAULT_CROSS_SERVER_BROADCAST_CHANNEL
  ) {}

  async publish(broadcast: CrossServerBroadcast<TPayload, TCommand>): Promise<void> {
    await this.publisherClient.publish(this.channel, JSON.stringify(broadcast));
  }

  async subscribe(handler: CrossServerBroadcastHandler<TPayload, TCommand>): Promise<void> {
    if (this.subscriberClient !== null) {
      throw new Error("CrossServerBroadcaster already has a subscriber");
    }
    const subscriberClient: RedisClientType = this.publisherClient.duplicate();
    subscriberClient.on("error", (error) => console.error(error));
    await subscriberClient.connect();
    await subscriberClient.subscribe(this.channel, (message) => {
      const broadcast = JSON.parse(message) as CrossServerBroadcast<TPayload, TCommand>;
      handler(broadcast);
    });
    this.subscriberClient = subscriberClient;
  }

  async disconnect(): Promise<void> {
    if (this.subscriberClient === null) {
      return;
    }
    await this.subscriberClient.unsubscribe(this.channel);
    await this.subscriberClient.quit();
    this.subscriberClient = null;
  }
}
