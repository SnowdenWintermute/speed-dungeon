import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { AdventuringParty } from "@speed-dungeon/common";
import { DescendOrExplore } from "@speed-dungeon/common";

export default function playerToggledReadyToDescendOrExploreHandler(
  username: string,
  descedOrExplore: DescendOrExplore
) {
  useGameStore.getState().mutateState((gameState) => {
    const party = getCurrentParty(gameState, username);
    if (party === undefined) return setAlert(`Couldn't find that player "${username}'s" party`);
    AdventuringParty.updatePlayerReadiness(party, username, descedOrExplore);
  });
}
