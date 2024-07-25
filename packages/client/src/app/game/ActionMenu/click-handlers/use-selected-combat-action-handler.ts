import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import { ClientToServerEvent } from "@speed-dungeon/common";

export default function useSelectedCombatActionHandler(
  mutateGameState: MutateState<GameState>,
  socket: PartyClientSocket
) {
  mutateGameState((gameState) => {
    gameState.detailedEntity = null;
    const previousActionMenuPageNumberOption = gameState.actionMenuParentPageNumbers.pop();
    if (typeof previousActionMenuPageNumberOption === "number") {
      gameState.actionMenuCurrentPageNumber = previousActionMenuPageNumberOption;
    }
    socket.emit(ClientToServerEvent.UseSelectedCombatAction, gameState.focusedCharacterId);
  });
}
