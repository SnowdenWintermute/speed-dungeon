import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  EntityId,
  GAME_UPDATE_COMMAND_TYPE_STRINGS,
  GameUpdateCommand,
  NestedNodeReplayEvent,
  ReplayEventType,
} from "@speed-dungeon/common";
import { GAME_UPDATE_COMMAND_HANDLERS } from "./game-update-command-handlers";
import { gameWorld } from "../../SceneManager";
import { VfxModel } from "../../vfx-models";

export class ReplayTreeManager {
  private queue: NestedNodeReplayEvent[] = [];
  private current: null | ReplayTreeProcessor = null;
  private preSpawnedVfx: { [id: EntityId]: VfxModel } = {};
  constructor() {}

  getCurrent() {
    return this.current;
  }

  async enqueueTree(tree: NestedNodeReplayEvent) {
    this.queue.push(tree);
  }
  /**
  So we don't have to wait for a model to spawn midway through the animation chain, 
  which would cause a moment where the animation freezes
   **/
  preSpawnAllVfx() {
    // @TODO
  }

  currentTreeCompleted() {
    return this.current === null || this.current.isComplete();
  }

  startNext() {
    const nextOption = this.queue.shift();
    this.current = nextOption ? new ReplayTreeProcessor(nextOption) : null;
  }

  process() {
    if (this.current) this.current.processBranches();
    if (this.currentTreeCompleted()) {
      this.current = null;
      this.startNext();
    }
  }
}

export class ReplayTreeProcessor {
  activeBranches: ReplayBranchProcessor[] = [];

  constructor(private root: NestedNodeReplayEvent) {
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
        const completedUpdateOption = branch.getCurrentGameUpdate();
        if (completedUpdateOption)
          console.log(
            "finished processing ",
            GAME_UPDATE_COMMAND_TYPE_STRINGS[completedUpdateOption.command.type],
            gameWorld.current?.tickCounter
          );

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
    // console.log(
    //   "started processing",
    //   ACTION_RESOLUTION_STEP_TYPE_STRINGS[node.gameUpdate.step],

    //   gameWorld.current?.tickCounter
    // );

    this.currentGameUpdateOption = { command: node.gameUpdate, isComplete: false };

    GAME_UPDATE_COMMAND_HANDLERS[node.gameUpdate.type](this.currentGameUpdateOption);
  }
}
