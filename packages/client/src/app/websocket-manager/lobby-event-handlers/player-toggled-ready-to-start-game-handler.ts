import { AppStore } from "@/mobx-stores/app-store";

export function playerToggledReadyToStartGameHandler(username: string) {
  const { gameStore } = AppStore.get();
  const game = gameStore.getExpectedGame();
  game.togglePlayerReadyToStartGameStatus(username);
}
