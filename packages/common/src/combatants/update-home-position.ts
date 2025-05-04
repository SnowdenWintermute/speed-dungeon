import { Quaternion, Vector3 } from "@babylonjs/core";
import { AdventuringParty } from "../adventuring-party/index.js";
import {
  COMBATANT_POSITION_SPACING_BETWEEN_ROWS,
  COMBATANT_POSITION_SPACING_SIDE,
} from "../app-consts.js";
import { CombatantProperties } from "./index.js";

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
  const rowStart = -rowLength / 2;

  const combatantRowIndex = combatantIdsInRow.indexOf(entityId);
  if (combatantRowIndex === -1) return console.error("Expected combatant id not found in row");

  const rowPositionOffset = rowStart + combatantRowIndex * COMBATANT_POSITION_SPACING_SIDE;

  let positionSpacing = -COMBATANT_POSITION_SPACING_BETWEEN_ROWS / 2;
  if (!isPlayer) positionSpacing *= -1;

  const homeLocation = new Vector3(rowPositionOffset, 0, positionSpacing);
  combatantProperties.homeLocation = homeLocation;

  // const forwardPosition = new Vector3(rowPositionOffset, 0, Math.abs(positionSpacing));

  // const forwardDirection = homeLocation.subtract(forwardPosition).normalize();

  // const directionToOrigin = Vector3.Zero().subtract(homeLocation).normalize();
  // const homeRotation = Quaternion.FromUnitVectorsToRef(
  //   forwardDirection,
  //   directionToOrigin,
  //   new Quaternion()
  // );
  // combatantProperties.homeRotation = homeRotation;

  const forward = new Vector3(0, 0, 1); // Model's default forward direction
  const directionToXAxis = new Vector3(0, 0, -positionSpacing).normalize(); // Facing toward X = 0

  const homeRotation = new Quaternion();
  Quaternion.FromUnitVectorsToRef(forward, directionToXAxis, homeRotation);
  combatantProperties.homeRotation = homeRotation;
  console.log("home rotation: ", homeRotation);

  //

  combatantProperties.position = combatantProperties.homeLocation.clone();
}
