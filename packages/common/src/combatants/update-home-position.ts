import { Vector3 } from "@babylonjs/core";
import { AdventuringParty } from "../adventuring-party/index.js";
import {
  COMBATANT_POSITION_SPACING_BETWEEN_ROWS,
  COMBATANT_POSITION_SPACING_SIDE,
} from "../app-consts.js";
import { MonsterType } from "../monsters/index.js";
import { CombatantProperties } from "./combatant-properties.js";

export function updateCombatantHomePosition(
  entityId: string,
  combatantProperties: CombatantProperties,
  party: AdventuringParty
) {
  const isPlayer = combatantProperties.controllingPlayer !== null;

  const combatantIdsInRow = isPlayer
    ? party.characterPositions
    : party.currentRoom.monsterPositions;
  const numberOfCombatantsInRow = combatantIdsInRow.length;

  const rowLength = COMBATANT_POSITION_SPACING_SIDE * (numberOfCombatantsInRow - 1);
  const rowStart = rowLength / 2;

  const combatantRowIndex = combatantIdsInRow.indexOf(entityId);
  if (combatantRowIndex === -1) return console.error("Expected combatant id not found in row");

  const rowPositionOffset = rowStart - combatantRowIndex * COMBATANT_POSITION_SPACING_SIDE;

  let positionSpacing = -COMBATANT_POSITION_SPACING_BETWEEN_ROWS / 2;
  if (!isPlayer) positionSpacing *= -1;

  combatantProperties.homeLocation = new Vector3(positionSpacing, 0, rowPositionOffset);
}
