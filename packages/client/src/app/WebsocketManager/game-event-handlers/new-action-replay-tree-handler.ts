import { gameWorld } from "@/app/3d-world/SceneManager";
import { NestedNodeReplayEvent, Replayer } from "@speed-dungeon/common";

export function newActionReplayTreeHandler(eventData: { replayTree: NestedNodeReplayEvent }) {
  Replayer.printReplayTree(eventData.replayTree);
  gameWorld.current?.replayTreeManager.enqueueTree(eventData.replayTree);
}
