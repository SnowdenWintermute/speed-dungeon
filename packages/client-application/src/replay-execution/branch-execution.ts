import {
  GameUpdateCommand,
  NestedNodeReplayEvent,
  ReplayEventType,
  throwIfLoopLimitReached,
} from "@speed-dungeon/common";
import { ReplayTreeExecution } from "./tree-execution";
import { GAME_UPDATE_HANDLERS } from "./update-handlers";
import { ReplayStepExecution } from "./replay-step-execution";

export class ReplayBranchExecution {
  private currentIndex = -1;
  private isComplete = false;
  private currentStepExecution: null | ReplayStepExecution<GameUpdateCommand> = null;

  constructor(
    private parentReplayTreeProcessor: ReplayTreeExecution,
    private node: NestedNodeReplayEvent,
    private branchProcessors: ReplayBranchExecution[]
  ) {}

  getCurrentGameUpdate() {
    return this.currentStepExecution;
  }

  private currentStepIsComplete(): boolean {
    if (this.currentStepExecution === null) return true;
    else return this.currentStepExecution.isComplete;
  }

  isDoneProcessing() {
    return this.isComplete;
  }

  getStepRemainingDuration(): number {
    return this.currentStepExecution?.durationRemaining ?? 0;
  }

  processAllCompletableSteps() {
    const currentStepExecution = this.getCurrentGameUpdate();
    if (currentStepExecution && currentStepExecution.shouldCompleteInSequence) {
      currentStepExecution.tryToCompleteInSequence(this.parentReplayTreeProcessor);
    }
    let branchIsComplete = this.isDoneProcessing();
    let currentStepComplete = this.currentStepIsComplete();
    let safetyCounter = -1;
    while (currentStepComplete && !branchIsComplete) {
      safetyCounter += 1;
      throwIfLoopLimitReached(safetyCounter);

      const currentStepExecution = this.getCurrentGameUpdate();
      if (currentStepExecution && currentStepExecution.shouldCompleteInSequence) {
        currentStepExecution.tryToCompleteInSequence(this.parentReplayTreeProcessor);
      }

      this.startProcessingNext();

      if (currentStepExecution === null) break;

      currentStepComplete = this.currentStepIsComplete();
      branchIsComplete = this.isDoneProcessing();
    }
  }

  private startProcessingNext() {
    this.currentIndex += 1;
    const node = this.node.events[this.currentIndex];

    if (node === undefined) {
      this.isComplete = true;
      return;
    }

    if (node.type === ReplayEventType.NestedNode) {
      const newBranch = new ReplayBranchExecution(
        this.parentReplayTreeProcessor,
        node,
        this.branchProcessors
      );
      newBranch.startProcessingNext();
      this.branchProcessors.push(newBranch);
      return;
    }

    this.currentStepExecution = new ReplayStepExecution(node.gameUpdate);

    // Any update may include cosmetic effect updates
    const cosmeticEffectsToStartOption = this.currentStepExecution.command.cosmeticEffectsToStart;
    const cosmeticEffectsToStopOption = this.currentStepExecution.command.cosmeticEffectsToStop;

    try {
      const sceneEntityServiceOption =
        this.parentReplayTreeProcessor.clientApplication.gameWorldView?.sceneEntityService;
      sceneEntityServiceOption?.stopCosmeticEffects(cosmeticEffectsToStopOption || []);
      sceneEntityServiceOption?.queueCosmeticEffectsStart(cosmeticEffectsToStartOption || []);
    } catch (err) {
      console.error("error with cosmetic effects", this.currentStepExecution.command, err);
    }

    GAME_UPDATE_HANDLERS[node.gameUpdate.type](
      this.parentReplayTreeProcessor.clientApplication,
      this.currentStepExecution
    );
  }
}
