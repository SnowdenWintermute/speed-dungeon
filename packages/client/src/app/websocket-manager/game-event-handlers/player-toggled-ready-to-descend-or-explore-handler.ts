import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { ExplorationAction } from "@speed-dungeon/common";

export default function playerToggledReadyToDescendOrExploreHandler(
  username: string,
  explorationAction: ExplorationAction
) {
  useGameStore.getState().mutateState((gameState) => {
    const party = getCurrentParty(gameState, username);
    if (party === undefined) return setAlert(`Couldn't find that player "${username}'s" party`);
    const { dungeonExplorationManager } = party;
    dungeonExplorationManager.updatePlayerExplorationActionChoice(username, explorationAction);

    // @INFO
    //
    // we used to think we had to clone because immer doesn't notice updates on
    // self mutating objects unless you replaced the object reference
    // ex:
    // party.dungeonExplorationManager = cloneDeep(dungeonExplorationManager);
    //
    // we couldn't put [immerable] = true on the dungeonExplorationManager subsystem because
    // we were passing a reference to its composing AdventuringParty class which seemingly caused infinite
    // recursion. Now we just don't let it hold it's own reference to party and pass party in any method
    // that requires it, and we can use [immerable] as normal to get reactive updates even with
    // self mutating functions
  });
}
