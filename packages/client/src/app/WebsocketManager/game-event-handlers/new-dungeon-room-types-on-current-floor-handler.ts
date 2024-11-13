import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { DungeonRoomType, ERROR_MESSAGES } from "@speed-dungeon/common";

export default function newDungeonRoomTypesOnCurrentFloorHandler(
  newRoomTypes: (DungeonRoomType | null)[]
) {
  useGameStore.getState().mutateState((gameState) => {
    const party = getCurrentParty(gameState, gameState.username || "");
    if (party === undefined) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

    party.clientCurrentFloorRoomsList = newRoomTypes;
    party.roomsExplored.onCurrentFloor = 0;
  });
}
