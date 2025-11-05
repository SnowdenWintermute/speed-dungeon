import { AppStore } from "@/mobx-stores/app-store";

export function characterDeletionHandler(username: string, characterId: string) {
  const { gameStore } = AppStore.get();
  const { party, player } = gameStore.getExpectedPlayerContext(username);

  party.removeCharacter(characterId, player);

  party.combatantManager.updateHomePositions();
}
