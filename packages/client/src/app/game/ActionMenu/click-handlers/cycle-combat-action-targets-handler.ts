import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { InPartyClientToServerEvent, NextOrPrevious } from "@speed-dungeon/common";
import cycleCharacterTargets from "@speed-dungeon/common/src/combat/targeting/cycle-character-targets";

export default function cycleCombatActionTargetsHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  partySocket: PartyClientSocket,
  direction: NextOrPrevious
) {
  mutateGameState((gameState) => {
    const clientPlayerAssociatedDataResult = getClientPlayerAssociatedData(gameState);
    if (clientPlayerAssociatedDataResult instanceof Error)
      return setAlert(mutateAlertState, clientPlayerAssociatedDataResult.message);
    const { game, party, player, focusedCharacter } = clientPlayerAssociatedDataResult;

    const result = cycleCharacterTargets(
      game,
      party,
      player,
      focusedCharacter.entityProperties.id,
      direction
    );
    if (result instanceof Error) return setAlert(mutateAlertState, result.message);

    partySocket.emit(
      InPartyClientToServerEvent.CycleCombatActionTargets,
      focusedCharacter.entityProperties.id,
      direction
    );
  });
}