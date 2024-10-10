import { websocketConnection } from "@/singletons/websocket-connection";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { ClientToServerEvent, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";

export default function useSelectedCombatActionHandler(mutateGameState: MutateState<GameState>) {
  mutateGameState((gameState) => {
    gameState.detailedEntity = null;
    const previousActionMenuPageNumberOption = gameState.actionMenuParentPageNumbers.pop();
    if (typeof previousActionMenuPageNumberOption === "number") {
      gameState.actionMenuCurrentPageNumber = previousActionMenuPageNumberOption;
    }
    websocketConnection.emit(
      ClientToServerEvent.UseSelectedCombatAction,
      gameState.focusedCharacterId
    );

    if (!gameState.game) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const partyResult = gameState.getParty();
    if (partyResult instanceof Error) return console.error(partyResult);
    const combatantResult = SpeedDungeonGame.getCharacter(
      gameState.game,
      partyResult.name,
      gameState.focusedCharacterId
    );
    if (combatantResult instanceof Error) return console.error(combatantResult);
    combatantResult.combatantProperties.combatActionTarget = null;
    combatantResult.combatantProperties.selectedCombatAction = null;
  });
}
