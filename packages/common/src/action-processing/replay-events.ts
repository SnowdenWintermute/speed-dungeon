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
          if (gameUpdate.type === GameUpdateCommandType.EntityMotion) {
            destinationOption = gameUpdate.translationOption?.destination || null;
          }
          console.log(
            new Array(depth).fill("-").join(""),
            GAME_UPDATE_COMMAND_TYPE_STRINGS[gameUpdate.type],
            ACTION_RESOLUTION_STEP_TYPE_STRINGS[gameUpdate.step],
            gameUpdate.completionOrderId,
            gameUpdate.type === GameUpdateCommandType.SpawnEntity
              ? gameUpdate.entity.type === SpawnableEntityType.Vfx
                ? "ENTITY POSTIION PACKET: " + gameUpdate.entity.vfx.vfxProperties.position
                : ""
              : ""
            // destinationOption || ""
          );
        } else {
          this.printReplayTree(node, depth + 1);
        }
      }
    }
  }
}
