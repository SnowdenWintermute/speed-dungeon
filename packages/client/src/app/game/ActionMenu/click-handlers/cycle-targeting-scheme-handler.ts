import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { ClientToServerEvent, SpeedDungeonGame } from "@speed-dungeon/common";

export default function cycleTargetingSchemeHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  socket: PartyClientSocket
) {
  mutateGameState((gameState) => {
    const clientPlayerAssociatedDataResult = getClientPlayerAssociatedData(gameState);
    if (clientPlayerAssociatedDataResult instanceof Error)
      return setAlert(mutateAlertState, clientPlayerAssociatedDataResult.message);
    const { game, party, player, focusedCharacter } = clientPlayerAssociatedDataResult;

    SpeedDungeonGame.cycleCharacterTargetingSchemes(
      game,
      party,
      player,
      focusedCharacter.entityProperties.id
    );

    socket.emit(ClientToServerEvent.CycleTargetingSchemes, focusedCharacter.entityProperties.id);
  });
}
