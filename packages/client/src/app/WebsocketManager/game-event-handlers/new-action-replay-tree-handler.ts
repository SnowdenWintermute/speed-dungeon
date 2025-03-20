import { gameWorld } from "@/app/3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";
import { EntityId, NestedNodeReplayEvent } from "@speed-dungeon/common";
import { synchronizeTargetingIndicators } from "./synchronize-targeting-indicators";

export function newActionReplayTreeHandler(eventData: {
  actionUserId: EntityId;
  replayTree: NestedNodeReplayEvent;
}) {
  useGameStore.getState().mutateState((state) => {
    synchronizeTargetingIndicators(state, null, eventData.actionUserId, []);
  });

  gameWorld.current?.replayTreeManager.enqueueTree(eventData.replayTree);
}
