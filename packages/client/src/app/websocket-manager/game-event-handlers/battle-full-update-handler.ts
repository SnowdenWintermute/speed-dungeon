import { AppStore } from "@/mobx-stores/app-store";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { Battle } from "@speed-dungeon/common";

export function battleFullUpdateHandler(battleOption: null | Battle) {
  const { game, party } = AppStore.get().gameStore.getFocusedCharacterContext();

  if (battleOption !== null) {
    const battle = battleOption;
    party.battleId = battle.id;
    const deserializedBattle = Battle.getDeserialized(battle, game, party);
    game.battles[battle.id] = deserializedBattle;

    const currentActorIsPlayerControlled =
      deserializedBattle.turnOrderManager.currentActorIsPlayerControlled(party);

    const turnTracker = deserializedBattle.turnOrderManager.getFastestActorTurnOrderTracker();
    characterAutoFocusManager.handleBattleStart(turnTracker);

    if (!currentActorIsPlayerControlled) {
      // it is ai controlled so lock input
      party.inputLock.lockInput();
    }
  } else {
    game.battles = {};
  }
}
