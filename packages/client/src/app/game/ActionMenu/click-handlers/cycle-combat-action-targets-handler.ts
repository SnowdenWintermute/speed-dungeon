import { setAlert } from "@/app/components/alerts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { ClientToServerEvent, NextOrPrevious, SpeedDungeonGame } from "@speed-dungeon/common";

export default function cycleCombatActionTargetsHandler(direction: NextOrPrevious) {
  useGameStore.getState().mutateState((gameState) => {
    const clientPlayerAssociatedDataResult = getClientPlayerAssociatedData(gameState);
    if (clientPlayerAssociatedDataResult instanceof Error)
      return setAlert(clientPlayerAssociatedDataResult.message);
    const { game, party, player, focusedCharacter } = clientPlayerAssociatedDataResult;

    const result = SpeedDungeonGame.cycleCharacterTargets(
      game,
      party,
      player,
      focusedCharacter.entityProperties.id,
      direction
    );
    if (result instanceof Error) return setAlert(result.message);

    websocketConnection.emit(ClientToServerEvent.CycleCombatActionTargets, {
      characterId: focusedCharacter.entityProperties.id,
      direction,
    });
  });
}
