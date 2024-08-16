import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import {
  AdventuringParty,
  COMBATANT_POSITION_SPACING_BETWEEN_ROWS,
  COMBATANT_POSITION_SPACING_SIDE,
  CombatantDetails,
} from "@speed-dungeon/common";
import { MonsterType } from "@speed-dungeon/common/src/monsters/monster-types";
import { Vector3 } from "babylonjs";

export default function requestSpawnCombatantModel(
  combatantDetails: CombatantDetails,
  party: AdventuringParty,
  mutateNextBabylonMessagingStore: MutateState<NextBabylonMessagingState>,
  modelDomPositionRef: React.RefObject<HTMLDivElement>
) {
  const entityId = combatantDetails.entityProperties.id;
  const { combatantProperties } = combatantDetails;

  let rowPositionOffset = 0;
  let rowLength = COMBATANT_POSITION_SPACING_SIDE * (party.characterPositions.length - 1);
  let rowStart = rowLength / 2;

  let isPlayer = false;
  let monsterType: null | MonsterType = null;

  party.characterPositions.forEach((id, i) => {
    if (id === entityId) {
      isPlayer = true;
      rowPositionOffset = rowStart - i * COMBATANT_POSITION_SPACING_SIDE;
    }
  });

  // if (!isPlayer) {
  //   rowLength =
  //     COMBATANT_POSITION_SPACING_SIDE * Object.values(party.currentRoom.monsters).length - 1;
  //   rowStart = -rowLength / 2;

  //   Object.entries(party.currentRoom.monsters)
  //     .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  //     .forEach(([monsterId, monster], i) => {
  //       if (monsterId === entityId) {
  //         rowPositionOffset = rowStart + i * COMBATANT_POSITION_SPACING_SIDE;
  //         monsterType = monster.monsterType;
  //       }
  //     });
  // }

  if (!isPlayer && !monsterType) return;

  let positionSpacing = -COMBATANT_POSITION_SPACING_BETWEEN_ROWS / 2;
  if (monsterType !== null) positionSpacing *= -1;

  mutateNextBabylonMessagingStore((state) => {
    state.nextToBabylonMessages.push({
      type: NextToBabylonMessageTypes.SpawnCombatantModel,
      combatantModelBlueprint: {
        entityId,
        species: combatantProperties.combatantSpecies,
        monsterType,
        class: combatantProperties.combatantClass,
        // startPosition: new Vector3(0, 0, rowPositionOffset),
        startPosition: new Vector3(positionSpacing, 0, rowPositionOffset),
        startRotation: 0,
        modelDomPositionRef,
      },
    });
  });
}
