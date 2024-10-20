import { setAlert } from "@/app/components/alerts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { ClientToServerEvent, NextOrPrevious, SpeedDungeonGame } from "@speed-dungeon/common";

export default function cycleCombatActionTargetsHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  direction: NextOrPrevious
) {
  mutateGameState((gameState) => {
    const clientPlayerAssociatedDataResult = getClientPlayerAssociatedData(gameState);
    if (clientPlayerAssociatedDataResult instanceof Error)
      return setAlert(mutateAlertState, clientPlayerAssociatedDataResult.message);
    const { game, party, player, focusedCharacter } = clientPlayerAssociatedDataResult;

    const result = SpeedDungeonGame.cycleCharacterTargets(
      game,
      party,
      player,
      focusedCharacter.entityProperties.id,
      direction
    );
    if (result instanceof Error) return setAlert(mutateAlertState, result.message);

    websocketConnection.emit(ClientToServerEvent.CycleCombatActionTargets, {
      characterId: focusedCharacter.entityProperties.id,
      direction,
    });
  });
}
