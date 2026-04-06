import { ClientApplication } from "@/client-application";
import { BaseClient } from "@/client-application/clients/base";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import {
  ActionAndRank,
  ActionRank,
  ClientIntent,
  ClientIntentType,
  CombatActionName,
  CombatantClass,
  CombatantId,
  EntityName,
  GameMode,
  GameName,
  ItemId,
  LOOP_SAFETY_ITERATION_LIMIT,
  NextOrPrevious,
  PartyName,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { TimeMachine } from "./time-machine";
import { ClientSingleton } from "@/client-application/clients/singleton";

export class ClientTestHarness<T extends BaseClient> {
  constructor(
    readonly clientApplication: ClientApplication,
    private clientSingleton: ClientSingleton<T>,
    private tickScheduler: ManualTickScheduler,
    private timeMachine: TimeMachine
  ) {}

  async settleIntentResult(intent: ClientIntent) {
    const intentId = this.clientSingleton.get().dispatchIntent(intent);
    await this.clientSingleton.get().waitForServerReply(intentId);

    await this.flushReplayTree();

    return intentId;
  }

  async flushReplayTree() {
    let iterationCount = 0;
    while (
      this.clientApplication.sequentialEventProcessor.isProcessing &&
      iterationCount < LOOP_SAFETY_ITERATION_LIMIT
    ) {
      if (iterationCount >= LOOP_SAFETY_ITERATION_LIMIT - 1) {
        console.error("LOOP_SAFETY_ITERATION_LIMIT reached");
      }
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
  }

  async createGame(gameName: string) {
    await this.settleIntentResult({
      type: ClientIntentType.CreateGame,
      data: { gameName: gameName as GameName, mode: GameMode.Race },
    });
  }
  async createParty(partyName: string) {
    await this.settleIntentResult({
      type: ClientIntentType.CreateParty,
      data: { partyName: partyName as PartyName },
    });
  }
  async createCharacter(characterName: string, combatantClass: CombatantClass) {
    await this.settleIntentResult({
      type: ClientIntentType.CreateCharacter,
      data: { name: characterName as EntityName, combatantClass },
    });
  }
  async toggleReadyToStartGame() {
    await this.settleIntentResult({
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    });
  }

  async toggleReadyToExplore() {
    return this.settleIntentResult({
      type: ClientIntentType.ToggleReadyToExplore,
      data: undefined,
    });
  }

  async toggleReadyToDescend() {
    return this.settleIntentResult({
      type: ClientIntentType.ToggleReadyToDescend,
      data: undefined,
    });
  }

  async selectCombatAction(characterId: CombatantId, actionName: CombatActionName, rank: number) {
    return this.settleIntentResult({
      type: ClientIntentType.SelectCombatAction,
      data: {
        characterId,
        actionAndRankOption: new ActionAndRank(actionName, rank as ActionRank),
      },
    });
  }

  async useSelectedCombatAction(characterId: CombatantId) {
    return this.settleIntentResult({
      type: ClientIntentType.UseSelectedCombatAction,
      data: { characterId },
    });
  }

  async useCombatAction(characterId: CombatantId, actionName: CombatActionName, rank: number) {
    await this.selectCombatAction(characterId, actionName, rank);
    return this.useSelectedCombatAction(characterId);
  }

  async selectCombatActionRank(characterId: CombatantId, actionRank: number) {
    return this.settleIntentResult({
      type: ClientIntentType.SelectCombatActionRank,
      data: { characterId, actionRank: actionRank as ActionRank },
    });
  }

  async cycleTargets(characterId: CombatantId, direction: NextOrPrevious) {
    return this.settleIntentResult({
      type: ClientIntentType.CycleCombatActionTargets,
      data: { characterId, direction },
    });
  }

  async cycleTargetingSchemes(characterId: CombatantId) {
    return this.settleIntentResult({
      type: ClientIntentType.CycleTargetingSchemes,
      data: { characterId },
    });
  }

  async selectHoldableHotswapSlot(characterId: CombatantId, slotIndex: number) {
    return this.settleIntentResult({
      type: ClientIntentType.SelectHoldableHotswapSlot,
      data: { characterId, slotIndex },
    });
  }

  async unequipSlot(characterId: CombatantId, slot: TaggedEquipmentSlot) {
    return this.settleIntentResult({
      type: ClientIntentType.UnequipSlot,
      data: { characterId, slot },
    });
  }

  async equipInventoryItem(
    characterId: CombatantId,
    itemId: ItemId,
    equipToAlternateSlot: boolean = false
  ) {
    return this.settleIntentResult({
      type: ClientIntentType.EquipInventoryItem,
      data: { characterId, itemId, equipToAlternateSlot },
    });
  }
}
