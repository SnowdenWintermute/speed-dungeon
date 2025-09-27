import { Vector3 } from "@babylonjs/core";
import { SequentialIdGenerator } from "../utils/index.js";
import { ACTION_RESOLUTION_STEP_TYPE_STRINGS } from "./action-steps/index.js";
import {
  GAME_UPDATE_COMMAND_TYPE_STRINGS,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "./game-update-commands.js";
import { SpawnableEntityType } from "../spawnables/index.js";

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

export class NestedNodeReplayEventUtls {
  static appendGameUpdate(node: NestedNodeReplayEvent, gameUpdate: GameUpdateCommand) {
    node.events.push({
      type: ReplayEventType.GameUpdate,
      gameUpdate,
    });
  }
}

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

  static printReplayTree(root: ReplayEventNode, depthOption?: number) {
    let depth = depthOption !== undefined ? depthOption : 1;
    if (root.type === ReplayEventType.NestedNode) {
      for (const node of root.events) {
        if (node.type === ReplayEventType.GameUpdate) {
          const { gameUpdate } = node;
          let destinationOption: null | Vector3 = null;
          if (
            gameUpdate.type === GameUpdateCommandType.CombatantMotion ||
            gameUpdate.type === GameUpdateCommandType.ActionEntityMotion
          ) {
            destinationOption = gameUpdate.mainEntityUpdate.translationOption?.destination || null;
          }
        } else {
          this.printReplayTree(node, depth + 1);
        }
      }
    }
  }
}
