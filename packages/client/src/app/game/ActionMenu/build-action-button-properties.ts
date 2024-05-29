import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { LobbyState } from "@/stores/lobby-store";
import { MutateState } from "@/stores/mutate-state";
import { UIState } from "@/stores/ui-store";
import {
  AdventuringParty,
  InPartyClientToServerEventTypes,
  InPartyServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import collectActionMenuRelevantInformation from "./collect-action-menu-relevant-information";
import createGameActions from "./create-game-actions";

export default function buildActionButtonProperties(
  party: AdventuringParty,
  partySocket: Socket<InPartyServerToClientEventTypes, InPartyClientToServerEventTypes>,
  gameState: GameState,
  mutateAlertState: MutateState<AlertState>,
  uiState: UIState,
  lobbyState: LobbyState
) {
  const relevantInformationResult = collectActionMenuRelevantInformation(gameState, party);
  if (relevantInformationResult instanceof Error) return relevantInformationResult;
  const gameActions = createGameActions(relevantInformationResult);
  const numberedButtonProperties = [];
  const topButtonProperties = [];
  const nextPrevButtonProperties = [];

  for (const action of gameActions) {
    // const clickHandler = createActionButtonClickHandler()
  }
}
