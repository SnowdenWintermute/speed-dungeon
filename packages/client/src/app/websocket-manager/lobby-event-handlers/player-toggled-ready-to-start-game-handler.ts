import { ArrayUtils } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";

export function playerToggledReadyToStartGameHandler(username: string) {
  const { gameStore } = AppStore.get();
  const game = gameStore.getExpectedGame();

  if (game.playersReadied.includes(username))
    ArrayUtils.removeElement(game.playersReadied, username);
  else game.playersReadied.push(username);
}
