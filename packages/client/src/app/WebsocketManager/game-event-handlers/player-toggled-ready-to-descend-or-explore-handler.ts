import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import getCurrentParty from "@/utils/getCurrentParty";
import { AdventuringParty } from "@speed-dungeon/common";
import { DescendOrExplore } from "@speed-dungeon/common";

export default function playerToggledReadyToDescendOrExploreHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  username: string,
  descedOrExplore: DescendOrExplore
) {
  mutateGameState((gameState) => {
    const party = getCurrentParty(gameState, username);
    if (party === undefined)
      return setAlert(mutateAlertState, `Couldn't find that player "${username}'s" party`);
    AdventuringParty.updatePlayerReadiness(party, username, descedOrExplore);
  });
}
