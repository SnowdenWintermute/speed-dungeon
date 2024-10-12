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
  let rowPositionOffset = 0;
  let rowLength = COMBATANT_POSITION_SPACING_SIDE * (party.characterPositions.length - 1);
  let rowStart = rowLength / 2;

  const isPlayer = combatantProperties.controllingPlayer !== null;
  let monsterType: null | MonsterType = null;

  party.characterPositions.forEach((id, i) => {
    if (id === entityId) {
      rowPositionOffset = rowStart - i * COMBATANT_POSITION_SPACING_SIDE;
    }
  });

  if (!isPlayer) {
    rowLength =
      COMBATANT_POSITION_SPACING_SIDE * (Object.values(party.currentRoom.monsters).length - 1);
    rowStart = rowLength / 2;
    const monsters = Object.entries(party.currentRoom.monsters);
    monsters.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    monsters.forEach(([monsterId, monster], i) => {
      if (monsterId === entityId) {
        rowPositionOffset = rowStart - i * COMBATANT_POSITION_SPACING_SIDE;
        monsterType = monster.combatantProperties.monsterType;
      }
    });
  }

  if (!isPlayer && monsterType === null) return;

  let positionSpacing = -COMBATANT_POSITION_SPACING_BETWEEN_ROWS / 2;
  if (monsterType !== null) positionSpacing *= -1;

  combatantProperties.homeLocation = new Vector3(positionSpacing, 0, rowPositionOffset);
}
