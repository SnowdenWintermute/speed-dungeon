import { createClientEventHandlers } from "./client-event-handlers";
import { ClientEvent, ClientEventHandlers } from "./client-events";
import { ReactiveNode } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { EventLogGameMessageService } from "../event-log/event-log-service";
import { ActionMenu } from "../action-menu";
import { ClientApplicationGameContext } from "../client-application-game-context";
import { CombatantFocus } from "../combatant-focus";
import { ClientApplicationLobbyContext } from "../client-application-lobby-context";
import { TargetIndicatorStore } from "../target-indicator-store";
import { ReplayTreeScheduler } from "../replay-execution/replay-tree-scheduler";
import { GameWorldView } from "@/xxNEW-game-world-view";

export class SequentialClientEventProcessor implements ReactiveNode {
  private eventHandlers: ClientEventHandlers;
  // pendingEvents and currentEventProcessing for observing in debug screen
  pendingEvents = new Set<ClientEvent>();
  currentEventProcessing: null | ClientEvent = null;
  private chain: Promise<void> = Promise.resolve();
  // incremented when clearing the queue. any event in the chain will check if it is part of a stale
  // generation before executing.
  private generation: number = 0;

  constructor(
    replayScheduler: ReplayTreeScheduler,
    gameWorldView: GameWorldView | null,
    actionMenu: ActionMenu,
    gameContext: ClientApplicationGameContext,
    combatantFocus: CombatantFocus,
    lobbyContext: ClientApplicationLobbyContext,
    targetIndicatorStore: TargetIndicatorStore,
    eventLogMessageService: EventLogGameMessageService
  ) {
    this.eventHandlers = createClientEventHandlers(
      replayScheduler,
      gameWorldView,
      actionMenu,
      gameContext,
      combatantFocus,
      lobbyContext,
      targetIndicatorStore,
      eventLogMessageService
    );
  }

  makeObservable() {
    makeAutoObservable(this);
  }

  get isProcessing() {
    return this.currentEventProcessing !== null || this.pendingEvents.size > 0;
  }

  scheduleEvent(event: ClientEvent) {
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
        await this.eventHandlers[event.type](event as never);
        const becameStaleWhileProcessing = scheduledGeneration !== this.generation;
        if (becameStaleWhileProcessing) {
          console.info("a stale event finished processing", event);
        }
      } catch (error) {
        console.error("error in SequentialClientEventProcessor", error);
      } finally {
        this.pendingEvents.delete(event);
        this.currentEventProcessing = null;
      }
    });
  }

  /** sets queued events to be skipped but does not cancel the currently processing event */
  cancelQueued() {
    this.generation += 1;
    this.pendingEvents.clear();
    // we don't set currentEventProcessing to null because there's no way
    // to cancel it. A "clean up after stale events" event could be created
    // to reset app to a clean state after an in-flight stale event finishes
  }
}
