import { setAlert } from "@/app/components/alerts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { ClientToServerEvent, SpeedDungeonGame } from "@speed-dungeon/common";

export default function cycleTargetingSchemeHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>
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

    websocketConnection.emit(
      ClientToServerEvent.CycleTargetingSchemes,
      focusedCharacter.entityProperties.id
    );
  });
}
