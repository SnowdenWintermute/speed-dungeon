import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import getCurrentParty from "@/utils/getCurrentParty";
import { DungeonRoom, ERROR_MESSAGES, updateCombatantHomePosition } from "@speed-dungeon/common";

export default function newDungeonRoomHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  room: DungeonRoom
) {
  mutateGameState((gameState) => {
    const party = getCurrentParty(gameState, gameState.username || "");
    if (party === undefined)
      return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

    party.playersReadyToDescend = [];
    party.playersReadyToExplore = [];
    party.currentRoom = room;

    for (const monster of Object.values(party.currentRoom.monsters))
      updateCombatantHomePosition(monster.entityProperties.id, monster.combatantProperties, party);
    party.roomsExplored.onCurrentFloor += 1;
    party.roomsExplored.total += 1;
    const indexOfRoomTypeToReveal = party.roomsExplored.onCurrentFloor - 1;
    party.clientCurrentFloorRoomsList[indexOfRoomTypeToReveal] = room.roomType;
  });
}
