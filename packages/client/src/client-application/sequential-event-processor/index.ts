import { createClientSequentialEventHandlers } from "./client-event-handlers";
import {
  CLIENT_EVENT_TYPE_STRINGS,
  ClientSequentialEvent,
  ClientSequentialEventHandlers,
  ReactiveNode,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { ClientApplication } from "..";

export class ClientSequentialEventProcessor implements ReactiveNode {
  private eventHandlers: ClientSequentialEventHandlers;
  // pendingEvents and currentEventProcessing for observing in debug screen
  pendingEvents = new Set<ClientSequentialEvent>();
  currentEventProcessing: null | ClientSequentialEvent = null;
  private chain: Promise<void> = Promise.resolve();
  // incremented when clearing the queue. any event in the chain will check if it is part of a stale
  // generation before executing.
  private generation: number = 0;

  constructor(private clientApplication: ClientApplication) {
    this.eventHandlers = createClientSequentialEventHandlers(clientApplication);
  }

  makeObservable() {
    makeAutoObservable(this);
  }

  get isProcessing() {
    return this.currentEventProcessing !== null || this.pendingEvents.size > 0;
  }

  scheduleEvent(event: ClientSequentialEvent) {
    this.pendingEvents.add(event);
    const scheduledGeneration = this.generation;
    this.chain = this.chain.then(async () => {
      const isStaleEvent = scheduledGeneration !== this.generation;
      if (isStaleEvent) {
        this.pendingEvents.delete(event);
        return;
      }

      this.currentEventProcessing = event;

      try {
        // why cast as never: see README.md -> Typed Event Handler Records
        await this.eventHandlers[event.type](event.data as never);
        const becameStaleWhileProcessing = scheduledGeneration !== this.generation;
        if (becameStaleWhileProcessing) {
          console.info("a stale event finished processing", event);
        }
      } catch (error) {
        console.error("error in SequentialClientSequentialEventProcessor", error);
      } finally {
        this.pendingEvents.delete(event);
        this.currentEventProcessing = null;
      }
    });
  }

  /** sets queued events to be skipped but does not cancel the currently processing event */
  cancelQueued() {
    console.log("canceled queued SequentialClientSequentialEventProcessor");
    this.generation += 1;
    this.pendingEvents.clear();
    // we don't set currentEventProcessing to null because there's no way
    // to cancel it. A "clean up after stale events" event could be created
    // to reset app to a clean state after an in-flight stale event finishes
  }
}
