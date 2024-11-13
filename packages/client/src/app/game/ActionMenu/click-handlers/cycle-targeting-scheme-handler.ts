import { setAlert } from "@/app/components/alerts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { ClientToServerEvent, SpeedDungeonGame } from "@speed-dungeon/common";

export default function cycleTargetingSchemeHandler() {
  useGameStore.getState().mutateState((gameState) => {
    const clientPlayerAssociatedDataResult = getClientPlayerAssociatedData(gameState);
    if (clientPlayerAssociatedDataResult instanceof Error)
      return setAlert(clientPlayerAssociatedDataResult.message);
    const { game, party, player, focusedCharacter } = clientPlayerAssociatedDataResult;

    SpeedDungeonGame.cycleCharacterTargetingSchemes(
      game,
      party,
      player,
      focusedCharacter.entityProperties.id
    );

    websocketConnection.emit(ClientToServerEvent.CycleTargetingSchemes, {
      characterId: focusedCharacter.entityProperties.id,
    });
  });
}
