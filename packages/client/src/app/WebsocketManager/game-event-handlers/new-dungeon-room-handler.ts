import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import getCurrentParty from "@/utils/getCurrentParty";
import {
  COMBATANT_POSITION_SPACING_BETWEEN_ROWS,
  COMBATANT_POSITION_SPACING_SIDE,
  CombatantSpecies,
  DungeonRoom,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import { Vector3 } from "babylonjs";

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
    party.roomsExplored.onCurrentFloor += 1;
    party.roomsExplored.total += 1;
    const indexOfRoomTypeToReveal = party.roomsExplored.onCurrentFloor - 1;
    party.clientCurrentFloorRoomsList[indexOfRoomTypeToReveal] = room.roomType;

    // SPAWN MONSTER 3D MODELS
    mutateNextBabylonMessagingStore((state) => {
      let rowPositionOffset = COMBATANT_POSITION_SPACING_SIDE;

      for (const monster of Object.values(party.currentRoom.monsters).sort(
        (a, b) => parseInt(a.entityProperties.id) - parseInt(b.entityProperties.id)
      )) {
        state.nextToBabylonMessages.push({
          type: NextToBabylonMessageTypes.SpawnCombatantModel,
          combatant: {
            entityId: monster.entityProperties.id,
            species: monster.combatantProperties.combatantSpecies,
            monsterType: monster.monsterType,
            class: monster.combatantProperties.combatantClass,
            startPosition: new Vector3(
              COMBATANT_POSITION_SPACING_BETWEEN_ROWS / 2,
              0,
              rowPositionOffset
            ),
            startRotation: Math.PI,
          },
        });

        rowPositionOffset = rowPositionOffset - COMBATANT_POSITION_SPACING_SIDE;
      }
    });
  });
}
