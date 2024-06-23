import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { ClientToServerEvent } from "@speed-dungeon/common";
import cycleCharacterTargetingSchemes from "@speed-dungeon/common/src/combat/targeting/cycle-character-targeting-schemes";

export default function cycleTargetingSchemeHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  partySocket: PartyClientSocket
) {
  mutateGameState((gameState) => {
    const clientPlayerAssociatedDataResult = getClientPlayerAssociatedData(gameState);
    if (clientPlayerAssociatedDataResult instanceof Error)
      return setAlert(mutateAlertState, clientPlayerAssociatedDataResult.message);
    const { game, party, player, focusedCharacter } = clientPlayerAssociatedDataResult;

    cycleCharacterTargetingSchemes(game, party, player, focusedCharacter.entityProperties.id);

    partySocket.emit(
      ClientToServerEvent.CycleTargetingSchemes,
      focusedCharacter.entityProperties.id
    );
  });
}
