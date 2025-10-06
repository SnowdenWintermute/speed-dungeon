import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { ExplorationAction } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";

export default function playerToggledReadyToDescendOrExploreHandler(
  username: string,
  explorationAction: ExplorationAction
) {
  useGameStore.getState().mutateState((gameState) => {
    const party = getCurrentParty(gameState, username);
    if (party === undefined) return setAlert(`Couldn't find that player "${username}'s" party`);
    const { dungeonExplorationManager } = party;
    dungeonExplorationManager.updatePlayerExplorationActionChoice(username, explorationAction);
    // must clone because immer doesn't notice updates on self mutating objects
    // unless you replace the object reference
    party.dungeonExplorationManager = cloneDeep(dungeonExplorationManager);
  });
}
