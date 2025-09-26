import { COMBAT_ACTION_NAME_STRINGS, CombatActionExecutionIntent } from "../combat/index.js";
import { ActionUserContext } from "../action-user-context/index.js";
import { CombatantSpecies } from "../combatants/combatant-species.js";
import { EntityId, Milliseconds } from "../primatives/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { SequentialIdGenerator } from "../utils/index.js";
import { ActionSequenceManager } from "./action-sequence-manager.js";
import { ACTION_RESOLUTION_STEP_TYPE_STRINGS, ActionIntentAndUser } from "./action-steps/index.js";
import { ActionTracker } from "./action-tracker.js";
import { NestedNodeReplayEvent, ReplayEventType } from "./replay-events.js";

export class TimeKeeper {
  ms: number = 0;
  constructor() {}
}

export class ActionSequenceManagerRegistry {
  private actionManagers: { [id: string]: ActionSequenceManager } = {};
  actionStepIdGenerator = new SequentialIdGenerator();
  completionOrderIdGenerator = new SequentialIdGenerator();
  private inputBlockingActionStepsPendingReferenceCount = 0;
  private turnEnded = false;
  public time = new TimeKeeper();
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
    actionUserContext: ActionUserContext,
    previousTrackerInSequenceOption: null | ActionTracker
  ) {
    const id = this.idGenerator.generate();
    const manager = new ActionSequenceManager(
      id,
      actionExecutionIntent,
      replayNode,
      actionUserContext,
      this,
      this.idGenerator,
      previousTrackerInSequenceOption
    );
    this.actionManagers[id] = manager;

    const stepTrackerResult = manager.startProcessingNext();
    if (stepTrackerResult instanceof Error) return stepTrackerResult;
    const initialGameUpdate = stepTrackerResult.currentStep.getGameUpdateCommandOption();
    this.incrementInputLockReferenceCount();
    return initialGameUpdate;
  }

  registerActions(
    sequenceManager: ActionSequenceManager,
    trackerOption: null | ActionTracker,
    actionUserContext: ActionUserContext,
    branchingActions: ActionIntentAndUser[]
  ) {
    for (const action of branchingActions) {
      const nestedReplayNode: NestedNodeReplayEvent = {
        type: ReplayEventType.NestedNode,
        events: [],
      };
      sequenceManager.replayNode.events.push(nestedReplayNode);

      const modifiedContextWithActionUser = new ActionUserContext(
        actionUserContext.game,
        actionUserContext.party,
        action.user
      );

      const initialGameUpdateOptionResult = this.registerAction(
        action.actionExecutionIntent,
        nestedReplayNode,
        modifiedContextWithActionUser,
        trackerOption
      );

      if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;

      if (initialGameUpdateOptionResult) {
        nestedReplayNode.events.push({
          type: ReplayEventType.GameUpdate,
          gameUpdate: initialGameUpdateOptionResult,
        });
      }
    }
  }

  incrementInputLockReferenceCount() {
    this.inputBlockingActionStepsPendingReferenceCount += 1;
  }

  decrementInputLockReferenceCount() {
    this.inputBlockingActionStepsPendingReferenceCount -= 1;
  }

  inputBlockingActionStepsArePending() {
    return this.inputBlockingActionStepsPendingReferenceCount > 0;
  }

  getTurnEnded() {
    return this.turnEnded;
  }

  setTurnEnded() {
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
      if (!trackerOption) {
        return 0;
      } else {
        //
      }
      const timeToCompletion = trackerOption.currentStep.getTimeToCompletion();

      if (msToTick === undefined) msToTick = timeToCompletion;
      else if (msToTick > timeToCompletion) {
        msToTick = timeToCompletion;
      }
      stepName = ACTION_RESOLUTION_STEP_TYPE_STRINGS[trackerOption.currentStep.type];
    }

    return msToTick || 0;
  }

  processActiveActionSequences(actionUserContext: ActionUserContext) {
    for (const sequenceManager of this.getManagers())
      sequenceManager.processCurrentStep(actionUserContext);

    const timeToTick = this.getShortestTimeToCompletion();
    this.time.ms += timeToTick;

    for (const sequenceManager of this.getManagers())
      sequenceManager.getCurrentTracker()?.currentStep.tick(timeToTick);
  }
}
