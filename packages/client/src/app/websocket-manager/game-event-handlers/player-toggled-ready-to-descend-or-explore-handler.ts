import { setAlert } from "@/app/components/alerts";
import { AppStore } from "@/mobx-stores/app-store";
import { ExplorationAction } from "@speed-dungeon/common";

export function playerToggledReadyToDescendOrExploreHandler(
  username: string,
  explorationAction: ExplorationAction
) {
  const party = AppStore.get().gameStore.getPartyOption();
  if (party === undefined) return setAlert(`Couldn't find that player "${username}'s" party`);
  const { dungeonExplorationManager } = party;
  dungeonExplorationManager.updatePlayerExplorationActionChoice(username, explorationAction);
}
