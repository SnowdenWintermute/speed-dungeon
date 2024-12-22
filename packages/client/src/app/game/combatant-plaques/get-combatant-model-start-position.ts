import { Combatant, cloneVector3 } from "@speed-dungeon/common";

export default function getCombatantModelStartPosition(combatant: Combatant) {
  const { combatantProperties } = combatant;

  let startRotation = Math.PI / 2;
  let modelCorrectionRotation = 0;

  const isPlayer = combatantProperties.controllingPlayer !== null;

  if (!isPlayer) {
    startRotation = -Math.PI / 2;
    modelCorrectionRotation = Math.PI;
  }

  return {
    startRotation,
    modelCorrectionRotation,
    startPosition: cloneVector3(combatantProperties.homeLocation),
  };
}
