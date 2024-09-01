import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { DungeonRoom, ERROR_MESSAGES, formatVector3 } from "@speed-dungeon/common";

export default function newDungeonRoomHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  mutateNextBabylonMessagingStore: MutateState<NextBabylonMessagingState>,
  room: DungeonRoom
) {
  mutateGameState((gameState) => {
    const party = getCurrentParty(gameState, gameState.username || "");
    if (party === undefined)
      return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

    party.playersReadyToDescend = [];
    party.playersReadyToExplore = [];
    party.currentRoom = room;
    console.log("NEW ROOM: ", party.currentRoom);
    console.log("NEW ROOM MONSTERS HOME POSITIONS: ");
    for (const monster of Object.values(party.currentRoom.monsters)) {
      console.log(formatVector3(monster.combatantProperties.homeLocation));
    }
    party.roomsExplored.onCurrentFloor += 1;
    party.roomsExplored.total += 1;
    const indexOfRoomTypeToReveal = party.roomsExplored.onCurrentFloor - 1;
    party.clientCurrentFloorRoomsList[indexOfRoomTypeToReveal] = room.roomType;
  });
}
