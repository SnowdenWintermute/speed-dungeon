import {
  CombatActionReplayTreePayload,
  ERROR_MESSAGES,
  GameUpdateCommand,
  InputLock,
  LOOP_SAFETY_ITERATION_LIMIT,
  NestedNodeReplayEvent,
  ReplayEventType,
  SequentialIdGenerator,
} from "@speed-dungeon/common";
import { GAME_UPDATE_COMMAND_HANDLERS } from "./game-update-command-handlers";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { startOrStopCosmeticEffects } from "./start-or-stop-cosmetic-effect";

export class ReplayTreeProcessorManager {
  private queue: { root: NestedNodeReplayEvent; onComplete: () => void }[] = [];
  private current: null | ReplayTreeProcessor = null;
  constructor() {}

  getCurrent() {
    return this.current;
  }

  isEmpty() {
    const hasCurrentActiveTree = this.current && !this.current.isComplete();
    return !hasCurrentActiveTree && this.queue.length === 0;
  }

  clear() {
    this.current = null;
    this.queue = [];
  }

  async enqueueTree(payload: CombatActionReplayTreePayload, onComplete: () => void) {
    this.queue.push({ root: payload.root, onComplete });

    useGameStore.getState().mutateState((state) => {
      const partyOption = getCurrentParty(state, state.username || "");
      if (partyOption && !payload.doNotLockInput) InputLock.lockInput(partyOption.inputLock);
      state.stackedMenuStates = [];
    });
  }

  currentTreeCompleted() {
    return this.current === null || this.current.isComplete();
  }

  startNext() {
    const nextOption = this.queue.shift();
    this.current = nextOption
      ? new ReplayTreeProcessor(nextOption.root, nextOption.onComplete)
      : null;
  }

  process() {
    if (this.current) this.current.processBranches();
    if (this.currentTreeCompleted()) {
      if (this.current !== null) {
        this.current.onComplete();
      }
      this.current = null;
      this.startNext();
    }
  }
}

export class ReplayTreeProcessor {
  static sequentialIdGenerator = new SequentialIdGenerator();
  sequenceId: number;

  activeBranches: ReplayBranchProcessor[] = [];
  private lastCompletedBranchId: number = -1;

  constructor(
    root: NestedNodeReplayEvent,
    public onComplete: () => void
  ) {
    this.sequenceId = ReplayTreeProcessor.sequentialIdGenerator.getNextIdNumeric();
    this.activeBranches.push(new ReplayBranchProcessor(this, root, this.activeBranches));
    console.log("constructed replay tree", this.sequenceId);
  }

  getActiveBranches() {
    return this.activeBranches;
  }

  isComplete() {
    return !this.activeBranches.length;
  }

  processBranches() {
    // iterate backwards so we can splice out branches without affecting the iteration
    for (let i = this.activeBranches.length - 1; i >= 0; i--) {
      const branch = this.activeBranches[i];
      if (!branch) continue;
      if (branch.isDoneProcessing()) this.activeBranches.splice(i, 1);
      let branchComplete = branch.isDoneProcessing();
      let currentStepComplete = branch.currentStepIsComplete();

      let safetyCounter = -1;
      while (currentStepComplete && !branchComplete) {
        safetyCounter += 1;
        if (safetyCounter > LOOP_SAFETY_ITERATION_LIMIT) {
          console.error(
            ERROR_MESSAGES.LOOP_SAFETY_ITERATION_LIMIT_REACHED(LOOP_SAFETY_ITERATION_LIMIT),
            "in replay tree manager"
          );
          break;
        }

        const completedUpdateOption = branch.getCurrentGameUpdate();

        branch.startProcessingNext();
        if (branch.getCurrentGameUpdate() === null) break;
        currentStepComplete = branch.currentStepIsComplete();
        branchComplete = branch.isDoneProcessing();
      }
    }
  }
}

export class GameUpdateTracker<T extends GameUpdateCommand> {
  private isComplete: boolean = false;
  private shouldCompleteInSequence: boolean = false;
  constructor(public readonly command: T) {}

  getIsComplete() {
    return this.isComplete;
  }

  setAsQueuedToComplete() {
    this.shouldCompleteInSequence = true;
  }
}

export class ReplayBranchProcessor {
  private currentIndex = -1;
  private isComplete = false;
  private currentGameUpdateOption: null | GameUpdateTracker<GameUpdateCommand> = null;
  constructor(
    private parentReplayTreeProcessor: ReplayTreeProcessor,
    private node: NestedNodeReplayEvent,
    private branchProcessors: ReplayBranchProcessor[]
  ) {}

  getCurrentGameUpdate() {
    return this.currentGameUpdateOption;
  }

  currentStepIsComplete(): boolean {
    if (this.currentGameUpdateOption === null) return true;
    else return this.currentGameUpdateOption.getIsComplete();
  }

  isDoneProcessing() {
    return this.isComplete;
  }

  startProcessingNext() {
    this.currentIndex += 1;
    const node = this.node.events[this.currentIndex];

    if (node === undefined) {
      this.isComplete = true;
      return;
    }

    if (node.type === ReplayEventType.NestedNode) {
      const newBranch = new ReplayBranchProcessor(
        this.parentReplayTreeProcessor,
        node,
        this.branchProcessors
      );
      newBranch.startProcessingNext();
      this.branchProcessors.push(newBranch);
      return;
    }

    this.currentGameUpdateOption = new GameUpdateTracker(node.gameUpdate);

    // Any update may include cosmetic effect updates
    const cosmeticEffectsToStartOption =
      this.currentGameUpdateOption.command.cosmeticEffectsToStart;
    const cosmeticEffectsToStopOption = this.currentGameUpdateOption.command.cosmeticEffectsToStop;

    try {
      startOrStopCosmeticEffects(cosmeticEffectsToStartOption, cosmeticEffectsToStopOption);
    } catch (err) {
      console.error("error with cosmetic effects", this.currentGameUpdateOption.command, err);
    }

    GAME_UPDATE_COMMAND_HANDLERS[node.gameUpdate.type](this.currentGameUpdateOption);
  }
}
