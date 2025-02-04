import { SequentialIdGenerator } from "../utils/index.js";
import {
  GAME_UPDATE_COMMAND_TYPE_STRINGS,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "./game-update-commands.js";

export class ReplayEventNode {
  events: (GameUpdateCommand | ReplayEventNode)[] = [];
  constructor() {}
}

export class Replayer {
  nodesExecuting: { id: string; node: ReplayEventNode }[] = [];
  idGenerator = new SequentialIdGenerator();
  lastResolutionIdCompleted: number = 0;
  constructor(public root: ReplayEventNode) {
    const nextId = this.idGenerator.getNextId();
    this.nodesExecuting = [{ id: nextId, node: root }];
  }

  tick() {
    for (const { id, node } of this.nodesExecuting) {
      const currentEventOption = node.events[0];
      if (!currentEventOption) continue;

      if (currentEventOption instanceof ReplayEventNode) {
        const newNode = currentEventOption.events.shift() as ReplayEventNode;
        this.nodesExecuting.push({ id: this.idGenerator.getNextId(), node: newNode });
      } else {
        // update current event status (apply to game state, check animation status)
        // if(currentEventOption.isDone()) {
        //   const completedEvent = node.events.shift()
        //   this.lastResolutionIdCompleted = completedEvent.resolutionOrderId
        // }
      }
    }

    this.nodesExecuting = this.nodesExecuting.filter(({ id, node }) => node.events.length === 0);
  }

  static printReplayTree(root: ReplayEventNode) {
    for (const node of root.events) {
      if (node instanceof ReplayEventNode) {
        console.log("BRANCH");
        this.printReplayTree(node);
      } else {
        if (
          node.type === GameUpdateCommandType.CombatantMovement ||
          node.type === GameUpdateCommandType.CombatantAnimation
        )
          console.log(node.animationName);
        console.log(GAME_UPDATE_COMMAND_TYPE_STRINGS[node.type], node.completionOrderId);
      }
    }
  }
}
