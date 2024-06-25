import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import getCurrentParty from "@/utils/getCurrentParty";
import { DungeonRoomType, ERROR_MESSAGES } from "@speed-dungeon/common";

export default function newDungeonRoomTypesOnCurrentFloorHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  newRoomTypes: (DungeonRoomType | null)[]
) {
  mutateGameState((gameState) => {
    const party = getCurrentParty(gameState, gameState.username || "");
    if (party === undefined)
      return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

    party.clientCurrentFloorRoomsList = newRoomTypes;
    party.roomsExplored.onCurrentFloor = 0;
  });
}
