import { ClientApplication } from "@/client-application";
import { BaseClient } from "@/client-application/clients/base";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { ClientIntent, LOOP_SAFETY_ITERATION_LIMIT } from "@speed-dungeon/common";
import { TimeMachine } from "./time-machine";

export class ClientTestHarness {
  constructor(
    readonly clientApplication: ClientApplication,
    private client: BaseClient,
    private tickScheduler: ManualTickScheduler,
    private timeMachine: TimeMachine
  ) {}

  async settleIntentResult(intent: ClientIntent) {
    const intentId = this.client.dispatchIntent(intent);
    await this.client.waitForServerReply(intentId);

    let iterationCount = 0;
    while (
      this.clientApplication.sequentialEventProcessor.isProcessing &&
      iterationCount < LOOP_SAFETY_ITERATION_LIMIT
    ) {
      iterationCount += 1;
      const remaining = this.clientApplication.replayTreeScheduler.getMinRemainingDuration();
      if (remaining > 0) {
        this.timeMachine.advanceTime(remaining);
      }
      this.tickScheduler.tick();
      // Yield the call stack so microtasks queued by ticking (e.g. resolved
      // promises in the sequential event processor chain) can execute.
      // Without this, isProcessing never updates because the synchronous
      // loop starves the microtask queue.
      await Promise.resolve();
    }

    return intentId;
  }
}
