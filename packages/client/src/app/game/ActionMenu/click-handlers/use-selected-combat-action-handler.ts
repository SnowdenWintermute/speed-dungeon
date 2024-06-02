import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import { InPartyClientToServerEvent } from "@speed-dungeon/common";

export default function useSelectedCombatActionHandler(
  mutateGameState: MutateState<GameState>,
  partySocket: PartyClientSocket
) {
  mutateGameState((gameState) => {
    gameState.selectedItem = null;
    gameState.detailedEntity = null;
    const previousActionMenuPageNumberOption = gameState.actionMenuParentPageNumbers.pop();
    if (typeof previousActionMenuPageNumberOption === "number") {
      gameState.actionMenuCurrentPageNumber = previousActionMenuPageNumberOption;
    }
    partySocket.emit(
      InPartyClientToServerEvent.UseSelectedCombatAction,
      gameState.focusedCharacterId
    );
  });
}
