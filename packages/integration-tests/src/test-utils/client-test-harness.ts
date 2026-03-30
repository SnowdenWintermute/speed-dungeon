import { ClientApplication } from "@/client-application";
import { BaseClient } from "@/client-application/clients/base";
import { ClientIntent } from "@speed-dungeon/common";

export class ClientTestHarness {
  constructor(
    readonly clientApplication: ClientApplication,
    private client: BaseClient
  ) {}

  async settleIntentResult(intent: ClientIntent) {
    const intentId = this.client.dispatchIntent(intent);
    await this.client.waitForServerReply(intentId);
    await this.clientApplication.sequentialEventProcessor.waitUntilIdle();
    return intentId;
  }
}
