import { AppStore } from "@/mobx-stores/app-store";
import { Username } from "@speed-dungeon/common";

export function playerToggledReadyToStartGameHandler(username: Username) {
  const { gameStore } = AppStore.get();
  const game = gameStore.getExpectedGame();
  game.togglePlayerReadyToStartGameStatus(username);
}
