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

export default function buildActionButtonProperties(
  party: AdventuringParty,
  partySocket: Socket<InPartyServerToClientEventTypes, InPartyClientToServerEventTypes>,
  gameState: GameState,
  mutateAlertState: MutateState<AlertState>,
  uiState: UIState,
  lobbyState: LobbyState
) {
  // const newActions = determineMenuActions()
}
