import { ClientApplication } from "@/client-application";
import { BaseClient } from "@/client-application/clients/base";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import {
  ActionAndRank,
  ActionRank,
  ActionResolutionStepType,
  BeforeOrAfter,
  ClientIntent,
  ClientIntentType,
  CombatActionName,
  CombatantClass,
  CombatantId,
  EntityName,
  GameMode,
  GameName,
  GameUpdateCommand,
  invariant,
  ItemId,
  NextOrPrevious,
  PartyName,
  TaggedEquipmentSlot,
  throwIfLoopLimitReached,
} from "@speed-dungeon/common";
import { ClientSingleton } from "@/client-application/clients/singleton";

export class ClientTestHarness<T extends BaseClient> {
  constructor(
    readonly clientApplication: ClientApplication,
    private clientSingleton: ClientSingleton<T>,
    readonly tickScheduler: ManualTickScheduler
  ) {}

  async dispatchAndAwaitReply(intent: ClientIntent) {
    const intentId = this.clientSingleton.get().dispatchIntent(intent);
    await this.clientSingleton.get().waitForServerReply(intentId);
  }

  async settleIntentResult(intent: ClientIntent) {
    const intentId = await this.dispatchAndAwaitReply(intent);
    await this.flushReplayTree();
    return intentId;
  }

  async flushReplayTree(untilMatchedStep?: {
    stoppingPoint: BeforeOrAfter;
    actionName: CombatActionName;
    step: ActionResolutionStepType;
  }) {
    let iterationCount = 0;
    const { replayTreeScheduler } = this.clientApplication;
    while (this.clientApplication.sequentialEventProcessor.isProcessing) {
      throwIfLoopLimitReached(iterationCount, "client-test-harness flushReplayTree");
      iterationCount += 1;

      const commandOption = replayTreeScheduler.current?.nextExpectedStep?.command;
      if (
        untilMatchedStep &&
        commandOption &&
        this.replayStepIsMatch(commandOption, untilMatchedStep)
      ) {
        if (untilMatchedStep.stoppingPoint === BeforeOrAfter.After) {
          await this.tickNextStep();
        }
        break;
      }

      await this.tickNextStep();
    }
  }

  private async tickNextStep() {
    const remaining = this.clientApplication.replayTreeScheduler.getMinRemainingDuration();
    invariant(remaining >= 0, "remaining duration should not be negative");
    this.tickScheduler.tick(remaining);
    // Yield the call stack so microtasks queued by ticking (e.g. resolved
    // promises in the sequential event processor chain) can execute.
    // Without this, isProcessing never updates because the synchronous
    // loop starves the microtask queue.
    await Promise.resolve();
  }

  private replayStepIsMatch(
    commandOption: GameUpdateCommand,
    toMatch: { actionName: CombatActionName; step: ActionResolutionStepType }
  ) {
    if (!commandOption) {
      return false;
    }
    const isMatch =
      commandOption.actionName === toMatch.actionName && commandOption.step === toMatch.step;
    if (isMatch) {
      console.log("found matching step");
      return true;
    } else {
      return false;
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

  async selectCombatAction(actionName: CombatActionName, rank: number) {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
    return this.settleIntentResult({
      type: ClientIntentType.SelectCombatAction,
      data: {
        characterId,
        actionAndRankOption: new ActionAndRank(actionName, rank as ActionRank),
      },
    });
  }

  async useSelectedCombatAction() {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
    const promise = this.settleIntentResult({
      type: ClientIntentType.UseSelectedCombatAction,
      data: { characterId },
    });
    this.clientApplication.actionMenu.onExecuteAction();
    return promise;
  }

  async useCombatAction(actionName: CombatActionName, rank: number) {
    await this.selectCombatAction(actionName, rank);
    return this.useSelectedCombatAction();
  }

  async selectCombatActionRank(actionRank: number) {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
    return this.settleIntentResult({
      type: ClientIntentType.SelectCombatActionRank,
      data: { characterId, actionRank: actionRank as ActionRank },
    });
  }

  async cycleTargets(direction: NextOrPrevious) {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
    return this.settleIntentResult({
      type: ClientIntentType.CycleCombatActionTargets,
      data: { characterId, direction },
    });
  }

  async cycleTargetingSchemes() {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
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
