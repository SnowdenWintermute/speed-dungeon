import { ANIMATION_NAME_STRINGS } from "../app-consts.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "../combat/index.js";
import { SequentialIdGenerator } from "../utils/index.js";
import {
  GAME_UPDATE_COMMAND_TYPE_STRINGS,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "./game-update-commands.js";

// export class ReplayEventNode {
//   events: (GameUpdateCommand | ReplayEventNode)[] = [];
//   constructor(public parentActionName: CombatActionName) {}
// }

export enum ReplayEventType {
  GameUpdate,
  NestedNode,
}

export type GameUpdateReplayEvent = {
  type: ReplayEventType.GameUpdate;
  gameUpdate: GameUpdateCommand;
};

export type NestedNodeReplayEvent = {
  type: ReplayEventType.NestedNode;
  events: ReplayEventNode[];
};

export type ReplayEventNode = GameUpdateReplayEvent | NestedNodeReplayEvent;

export class Replayer {
  nodesExecuting: { id: string; node: ReplayEventNode }[] = [];
  idGenerator = new SequentialIdGenerator();
  lastResolutionIdCompleted: number = 0;
  constructor(public root: ReplayEventNode) {
    const nextId = this.idGenerator.getNextId();
    this.nodesExecuting = [{ id: nextId, node: root }];
  }

  tick() {
    //
  }

  static printReplayTree(root: ReplayEventNode) {
    if (root.type === ReplayEventType.NestedNode)
      for (const node of root.events) {
        if (node.type === ReplayEventType.GameUpdate) {
          console.log(
            //@ts-ignore
            node.gameUpdate.animationName
              ? //@ts-ignore
                ANIMATION_NAME_STRINGS[node.gameUpdate.animationName]
              : "",
            GAME_UPDATE_COMMAND_TYPE_STRINGS[node.gameUpdate.type],
            node.gameUpdate.completionOrderId
          );
        } else {
          this.printReplayTree(node);
        }
      }
  }
}
