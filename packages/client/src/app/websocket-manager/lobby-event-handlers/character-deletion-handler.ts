import { AppStore } from "@/mobx-stores/app-store";

export function characterDeletionHandler(username: string, characterId: string) {
  const { gameStore } = AppStore.get();
  const { game, party, player } = gameStore.getExpectedPlayerContext(username);

  party.removeCharacter(characterId, player, game);

  party.combatantManager.updateHomePositions();
}
