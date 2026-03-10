import { GameWorldView } from "@/game-world-view";
import { createClientEventHandlers } from "./client-event-handlers";
import { ClientEvent, ClientEventHandlers } from "./client-events";
import { ReplayTreeProcessorManager } from "@/replay-tree-manager";
import { GameStore } from "@/mobx-stores/game";
import { LobbyStore } from "@/mobx-stores/lobby";
import { ActionMenuStore } from "@/mobx-stores/action-menu";
import { TargetIndicatorStore } from "@/mobx-stores/target-indicators";
import { EventLogGameMessageService } from "../event-log/event-log-service";
import { CharacterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { ActionMenuStatePool } from "../action-menu/action-menu-state-pool";
import { ReactiveNode } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class SequentialClientEventProcessor implements ReactiveNode {
  private eventHandlers: ClientEventHandlers;
  pendingEvents = new Set<ClientEvent>();
  currentEventProcessing: null | ClientEvent = null;
  private chain: Promise<void> = Promise.resolve();
  // incremented when clearing the queue. any event in the chain will check if it is part of a stale
  // generation before executing.
  private generation: number = 0;

  constructor(
    replayTreeProcessor: ReplayTreeProcessorManager,
    gameWorldView: GameWorldView | null,
    gameStore: GameStore,
    lobbyStore: LobbyStore,
    actionMenuStore: ActionMenuStore,
    targetIndicatorStore: TargetIndicatorStore,
    eventLogMessageService: EventLogGameMessageService,
    characterAutoFocusManager: CharacterAutoFocusManager,
    actionMenuStatePool: ActionMenuStatePool
  ) {
    this.eventHandlers = createClientEventHandlers(
      replayTreeProcessor,
      gameWorldView,
      gameStore,
      lobbyStore,
      actionMenuStore,
      targetIndicatorStore,
      eventLogMessageService,
      characterAutoFocusManager,
      actionMenuStatePool
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

  clear() {
    this.generation += 1;
    this.pendingEvents.clear();
  }
}
