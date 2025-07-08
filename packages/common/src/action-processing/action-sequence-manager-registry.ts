import { CombatActionExecutionIntent } from "../combat/index.js";
import { CombatantContext } from "../combatant-context/index.js";
import { CombatantSpecies } from "../combatants/combatant-species.js";
import { EntityId, Milliseconds } from "../primatives/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { SequentialIdGenerator } from "../utils/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import { ACTION_RESOLUTION_STEP_TYPE_STRINGS } from "./action-steps/index.js";
import { ActionTracker } from "./action-tracker.js";
import { NestedNodeReplayEvent } from "./replay-events.js";

export class ActionSequenceManagerRegistry {
  private actionManagers: { [id: string]: ActionSequenceManager } = {};
  actionStepIdGenerator = new SequentialIdGenerator();
  private inputBlockingActionStepsPendingReferenceCount = 0;
  private turnEnded = false;
  constructor(
    private idGenerator: IdGenerator,
    public readonly animationLengths: Record<CombatantSpecies, Record<string, Milliseconds>>
  ) {}

  isEmpty() {
    return !Object.values(this.actionManagers).length;
  }

  isNotEmpty() {
    return !this.isEmpty();
  }

  registerAction(
    actionExecutionIntent: CombatActionExecutionIntent,
    replayNode: NestedNodeReplayEvent,
    combatantContext: CombatantContext,
    previousTrackerInSequenceOption: null | ActionTracker,
    time: { ms: Milliseconds }
  ) {
    const id = this.idGenerator.generate();
    const manager = new ActionSequenceManager(
      id,
      actionExecutionIntent,
      replayNode,
      combatantContext,
      this,
      this.idGenerator,
      previousTrackerInSequenceOption
    );
    this.actionManagers[id] = manager;

    const stepTrackerResult = manager.startProcessingNext(time);
    if (stepTrackerResult instanceof Error) return stepTrackerResult;
    const initialGameUpdate = stepTrackerResult.currentStep.getGameUpdateCommandOption();
    this.incrementInputLockReferenceCount();
    return initialGameUpdate;
  }

  incrementInputLockReferenceCount() {
    this.inputBlockingActionStepsPendingReferenceCount += 1;
    console.log("incremented:", this.inputBlockingActionStepsPendingReferenceCount);
  }

  decrementInputLockReferenceCount() {
    this.inputBlockingActionStepsPendingReferenceCount -= 1;
    console.log("decremented:", this.inputBlockingActionStepsPendingReferenceCount);
  }

  inputBlockingActionStepsArePending() {
    console.log("pending:", this.inputBlockingActionStepsPendingReferenceCount);
    return this.inputBlockingActionStepsPendingReferenceCount > 0;
  }

  getTurnEnded() {
    return this.turnEnded;
  }

  markTurnEnded() {
    this.turnEnded = true;
  }

  getManager(id: EntityId) {
    return this.actionManagers[id];
  }

  unRegisterActionManager(id: string) {
    delete this.actionManagers[id];
  }

  getManagers() {
    return Object.values(this.actionManagers);
  }

  getShortestTimeToCompletion(): number {
    // @PERF - check if a minHeap has better performance
    let msToTick;
    let stepName;
    for (const manager of this.getManagers()) {
      const trackerOption = manager.getCurrentTracker();
      if (!trackerOption) return 0;
      const timeToCompletion = trackerOption.currentStep.getTimeToCompletion() || 0;
      if (msToTick === undefined) msToTick = timeToCompletion;
      else if (msToTick > timeToCompletion) {
        msToTick = timeToCompletion;
      }
      stepName = ACTION_RESOLUTION_STEP_TYPE_STRINGS[trackerOption.currentStep.type];
    }
    // console.log("msToTick", stepName, msToTick);
    return msToTick || 0;
  }
}
