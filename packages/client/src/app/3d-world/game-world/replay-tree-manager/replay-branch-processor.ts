import { GameUpdateCommand, NestedNodeReplayEvent, ReplayEventType } from "@speed-dungeon/common";
import { startOrStopCosmeticEffects } from "./start-or-stop-cosmetic-effect";
import { GAME_UPDATE_COMMAND_HANDLERS } from "./game-update-command-handlers";
import { ReplayTreeProcessor } from "./replay-tree-processor";
import { GameUpdateTracker } from "./game-update-tracker";

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
