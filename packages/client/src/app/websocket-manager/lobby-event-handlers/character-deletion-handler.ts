import { AppStore } from "@/mobx-stores/app-store";
import { EntityId, Username } from "@speed-dungeon/common";

export function characterDeletionHandler(username: Username, characterId: EntityId) {
  const { gameStore } = AppStore.get();
  const { game, party, player } = gameStore.getExpectedPlayerContext(username);

  party.removeCharacter(characterId, player, game);

  party.combatantManager.updateHomePositions();
}
