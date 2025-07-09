import {
  CombatActionReplayTreePayload,
  GameUpdateCommand,
  InputLock,
  NestedNodeReplayEvent,
  ReplayEventType,
} from "@speed-dungeon/common";
import { GAME_UPDATE_COMMAND_HANDLERS } from "./game-update-command-handlers";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { MenuStateType } from "@/app/game/ActionMenu/menu-state";
import { startOrStopCosmeticEffects } from "./start-or-stop-cosmetic-effect";

export class ReplayTreeManager {
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
      if (partyOption) InputLock.lockInput(partyOption.inputLock);
      state.stackedMenuStates = [];
      // if (
      //   state.stackedMenuStates[0] &&
      //   state.stackedMenuStates[0].type === MenuStateType.CombatActionSelected
      // ) {
      //   state.stackedMenuStates.pop();
      // }
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
  activeBranches: ReplayBranchProcessor[] = [];

  constructor(
    root: NestedNodeReplayEvent,
    public onComplete: () => void
  ) {
    this.activeBranches.push(new ReplayBranchProcessor(root, this.activeBranches));
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
      while (currentStepComplete && !branchComplete) {
        const _completedUpdateOption = branch.getCurrentGameUpdate();

        branch.startProcessingNext();
        if (branch.getCurrentGameUpdate() === null) break;
        currentStepComplete = branch.currentStepIsComplete();
        branchComplete = branch.isDoneProcessing();
      }
    }
  }
}

export interface GameUpdate {
  command: GameUpdateCommand;
  isComplete: boolean;
}

export class ReplayBranchProcessor {
  private currentIndex = -1;
  private isComplete = false;
  private currentGameUpdateOption: null | GameUpdate = null;
  constructor(
    private node: NestedNodeReplayEvent,
    private branchProcessors: ReplayBranchProcessor[]
  ) {}

  getCurrentGameUpdate() {
    return this.currentGameUpdateOption;
  }

  currentStepIsComplete(): boolean {
    if (this.currentGameUpdateOption === null) return true;
    else return this.currentGameUpdateOption.isComplete;
  }
  isDoneProcessing() {
    return this.isComplete;
  }
  startProcessingNext() {
    this.currentIndex += 1;
    const node = this.node.events[this.currentIndex];
    if (node === undefined) return (this.isComplete = true);
    if (node.type === ReplayEventType.NestedNode) {
      const newBranch = new ReplayBranchProcessor(node, this.branchProcessors);
      newBranch.startProcessingNext();
      this.branchProcessors.push(newBranch);
      return;
    }

    this.currentGameUpdateOption = { command: node.gameUpdate, isComplete: false };

    GAME_UPDATE_COMMAND_HANDLERS[node.gameUpdate.type](this.currentGameUpdateOption);

    // Any update may include cosmetic effect updates
    const cosmeticEffectsToStartOption =
      this.currentGameUpdateOption.command.cosmeticEffectsToStart;
    const cosmeticEffectsToStopOption = this.currentGameUpdateOption.command.cosmeticEffectsToStop;
    startOrStopCosmeticEffects(cosmeticEffectsToStartOption, cosmeticEffectsToStopOption);
  }
}
