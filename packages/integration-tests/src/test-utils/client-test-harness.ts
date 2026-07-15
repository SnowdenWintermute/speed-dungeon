import { ClientApplication } from "@/client-application";
import { BaseClient } from "@/client-application/clients/base";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import {
  AbilityTreeAbility,
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionAndRank,
  ActionRank,
  ActionResolutionStepType,
  BeforeOrAfter,
  CharacterControlScheme,
  ClientIntent,
  ClientIntentType,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionName,
  CombatantClass,
  CombatantId,
  CombatAttribute,
  DateRange,
  EntityName,
  GameId,
  GameMode,
  GameName,
  GameStateUpdate,
  GameStateUpdateType,
  GameUpdateCommand,
  invariant,
  ItemId,
  Milliseconds,
  NextOrPrevious,
  PartyName,
  TaggedEquipmentSlot,
  throwIfLoopLimitReached,
} from "@speed-dungeon/common";
import { ClientSingleton } from "@/client-application/clients/singleton";
import { CombatActionHistoryInspector } from "./combat-action-history-inspector.js";
import { PausableEndpoint } from "./pausable-endpoint.js";
import { TimeMachine } from "./time-machine.js";

export class ClientTestHarness<T extends BaseClient> {
  readonly actionHistory: CombatActionHistoryInspector;
  constructor(
    private timeMachine: TimeMachine,
    readonly clientApplication: ClientApplication,
    private clientSingleton: ClientSingleton<T>,
    readonly tickScheduler: ManualTickScheduler
  ) {
    this.actionHistory = new CombatActionHistoryInspector(clientApplication);
  }

  pauseTransport() {
    (this.clientSingleton.get().connectionEndpoint as PausableEndpoint).pause();
  }

  resumeTransport() {
    (this.clientSingleton.get().connectionEndpoint as PausableEndpoint).resume();
  }

  awaitMessageOfType(type: GameStateUpdateType): Promise<GameStateUpdate> {
    return new Promise((resolve) => {
      const endpoint = this.clientSingleton.get().connectionEndpoint;
      const checkForExpectedType = (raw: string | ArrayBuffer) => {
        const message = JSON.parse(raw.toString()) as GameStateUpdate;
        if (message.type === type) {
          endpoint.off("message", checkForExpectedType);
          resolve(message);
        }
      };
      endpoint.on("message", checkForExpectedType);
    });
  }

  async dispatchAndAwaitReply(intent: ClientIntent) {
    const intentId = this.clientSingleton.get().dispatchIntent(intent);
    await this.clientSingleton.get().waitForServerReply(intentId);
  }

  async settleIntentResult(intent: ClientIntent) {
    const intentId = await this.dispatchAndAwaitReply(intent);
    const durationTicked = await this.flushReplayTree();
    await this.clientApplication.sequentialEventProcessor.waitUntilIdle();
    return { intentId, durationTicked };
  }

  /** returns the duration ticked in ms so we can use it to
   * advance time in the test until input would be unlocked */
  async flushReplayTree(untilMatchedStep?: {
    stoppingPoint: BeforeOrAfter;
    actionName: CombatActionName;
    step: ActionResolutionStepType;
  }): Promise<Milliseconds> {
    let iterationCount = 0;
    const { replayTreeScheduler } = this.clientApplication;
    let matched = false;
    let durationTicked = 0;
    while (this.clientApplication.sequentialEventProcessor.isProcessing) {
      throwIfLoopLimitReached(
        iterationCount,
        `client-test-harness flushReplayTree at ${JSON.stringify(this.clientApplication.sequentialEventProcessor.currentEventProcessing)}`
      );
      iterationCount += 1;

      const commandOption = replayTreeScheduler.current?.nextExpectedStep?.command;
      if (
        untilMatchedStep !== undefined &&
        commandOption !== undefined &&
        this.replayStepIsMatch(commandOption, untilMatchedStep)
      ) {
        if (untilMatchedStep.stoppingPoint === BeforeOrAfter.After) {
          durationTicked += await this.tickNextStep();
        }
        matched = true;
        break;
      }

      durationTicked += await this.tickNextStep();
    }

    if (untilMatchedStep && !matched) {
      throw new Error(
        `${JSON.stringify(untilMatchedStep)} ,expected to match a step ${ACTION_RESOLUTION_STEP_TYPE_STRINGS[untilMatchedStep.step]} in action ${COMBAT_ACTION_NAME_STRINGS[untilMatchedStep.actionName]} but never found it`
      );
    }

    return durationTicked;
  }

  /** returns the duration ticked in ms */
  private async tickNextStep(): Promise<Milliseconds> {
    const remaining = this.clientApplication.replayTreeScheduler.getMinRemainingDuration();
    invariant(remaining >= 0, "remaining duration should not be negative");
    this.tickScheduler.tick(remaining);
    // Yield the call stack so microtasks queued by ticking (e.g. resolved
    // promises in the sequential event processor chain) can execute.
    // Without this, isProcessing never updates because the synchronous
    // loop starves the microtask queue.
    await Promise.resolve();
    return remaining;
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
      return true;
    } else {
      return false;
    }
  }

  async createGame(
    gameName: GameName,
    mode: GameMode = GameMode.UnrankedRace,
    controlScheme: CharacterControlScheme = CharacterControlScheme.Captain,
    continueGameId?: GameId
  ) {
    await this.settleIntentResult({
      type: ClientIntentType.CreateGame,
      data: { gameName, mode, controlScheme, continueGameId },
    });
  }
  async joinGame(gameId: GameId) {
    await this.settleIntentResult({
      type: ClientIntentType.JoinGame,
      data: { gameId: gameId as GameId },
    });
  }
  async tryJoinExpectedSingleGameInList() {
    await this.fetchGameList();
    expect(this.clientApplication.lobbyContext.gameList.length).toBe(1);
    const otherGame = this.clientApplication.lobbyContext.gameList[0];
    invariant(otherGame !== undefined, "checked above that game list had a game");
    await this.joinGame(otherGame.gameId);
  }

  async fetchGameList() {
    await this.settleIntentResult({
      type: ClientIntentType.RequestsGameList,
      data: undefined,
    });
  }
  async createParty(partyName: string) {
    await this.settleIntentResult({
      type: ClientIntentType.CreateParty,
      data: { partyName: partyName as PartyName },
    });
  }
  async joinParty(partyName: string) {
    await this.settleIntentResult({
      type: ClientIntentType.JoinParty,
      data: { partyName: partyName as PartyName },
    });
  }
  async leaveGame() {
    await this.settleIntentResult({
      type: ClientIntentType.LeaveGame,
      data: undefined,
    });
  }
  async createCharacter(characterName: string, combatantClass: CombatantClass) {
    await this.settleIntentResult({
      type: ClientIntentType.CreateCharacterInGame,
      data: { name: characterName as EntityName, combatantClass },
    });
  }
  async deleteCharacterInGame(characterId: CombatantId) {
    await this.settleIntentResult({
      type: ClientIntentType.DeleteCharacterInGame,
      data: { characterId },
    });
  }
  async toggleReadyToStartGame() {
    await this.settleIntentResult({
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    });
  }

  async toggleReadyToExplore() {
    const result = await this.settleIntentResult({
      type: ClientIntentType.ToggleReadyToExplore,
      data: undefined,
    });
    this.timeMachine.advanceTime(result.durationTicked);
    return result;
  }

  async toggleReadyToDescend() {
    const result = await this.settleIntentResult({
      type: ClientIntentType.ToggleReadyToDescend,
      data: undefined,
    });
    this.timeMachine.advanceTime(result.durationTicked);
    return result;
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
    const result = await promise;
    // sometimes it would unlock earlier than the server unlocked if I didn't add 1 or Math.ceil
    this.timeMachine.advanceTime(Math.ceil(result.durationTicked));
    return result;
  }

  async passTurns(count: number) {
    for (let i = 0; i < count; i += 1) {
      await this.useCombatAction(CombatActionName.PassTurn, 1);
    }
  }

  async useCombatAction(actionName: CombatActionName, rank?: number) {
    await this.selectCombatAction(actionName, rank || 1);
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

  async selectHoldableHotswapSlot(slotIndex: number) {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
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

  async equipItemFromGround(
    characterId: CombatantId,
    itemId: ItemId,
    equipToAlternateSlot: boolean = false
  ) {
    return this.settleIntentResult({
      type: ClientIntentType.EquipItemFromGround,
      data: { characterId, itemId, equipToAlternateSlot },
    });
  }

  async dropEquippedItem(characterId: CombatantId, slot: TaggedEquipmentSlot) {
    return this.settleIntentResult({
      type: ClientIntentType.DropEquippedItem,
      data: { characterId, slot },
    });
  }

  async allocateAbilityPoint(ability: AbilityTreeAbility) {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
    return this.settleIntentResult({
      type: ClientIntentType.AllocateAbilityPoint,
      data: { characterId, ability },
    });
  }

  async allocateAttributePoint(attribute: CombatAttribute) {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
    return this.settleIntentResult({
      type: ClientIntentType.IncrementAttribute,
      data: { characterId, attribute },
    });
  }

  async pickUpItem(id: ItemId) {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
    return this.settleIntentResult({
      type: ClientIntentType.PickUpItems,
      data: { characterId, itemIds: [id] },
    });
  }

  async dropItem(itemId: ItemId) {
    const characterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
    return this.settleIntentResult({
      type: ClientIntentType.DropItem,
      data: { characterId, itemId },
    });
  }

  async createSavedCharacter(
    name: string,
    combatantClass: CombatantClass,
    controlScheme: CharacterControlScheme
  ) {
    return this.settleIntentResult({
      type: ClientIntentType.CreateSavedCharacter,
      data: {
        name: name as EntityName,
        combatantClass,
        controlScheme,
      },
    });
  }

  async deleteSavedCharacter(entityId: CombatantId) {
    return this.settleIntentResult({
      type: ClientIntentType.DeleteSavedCharacter,
      data: {
        entityId,
      },
    });
  }

  async addSavedCharacterToProgressionGame(entityId: CombatantId) {
    return this.settleIntentResult({
      type: ClientIntentType.AddSavedCharacterToProgressionGame,
      data: {
        entityId,
      },
    });
  }

  async removeSavedCharacterFromProgressionGame(characterId: CombatantId) {
    return this.settleIntentResult({
      type: ClientIntentType.DeleteCharacterInGame,
      data: {
        characterId,
      },
    });
  }

  async selectProgressionGameStartingFloor(floorNumber: number) {
    return this.settleIntentResult({
      type: ClientIntentType.SelectProgressionGameStartingFloor,
      data: {
        floorNumber,
      },
    });
  }

  async abandonIronmanRun(runId: GameId) {
    return this.settleIntentResult({
      type: ClientIntentType.AbandonIronmanRun,
      data: {
        runId,
      },
    });
  }

  async requestGameHistory(page: number, dateRange?: DateRange) {
    return this.settleIntentResult({
      type: ClientIntentType.GetUserGameHistory,
      data: { page, dateRange },
    });
  }

  async useFireRankTwoOnAllEnemies() {
    await this.selectCombatAction(CombatActionName.Fire, 2);
    await this.cycleTargetingSchemes();
    await this.useSelectedCombatAction();
  }
}
