import { CHARACTER_SLOT_SPACING } from "@/app/lobby/saved-character-manager";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import { Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES, EntityId, GameMode } from "@speed-dungeon/common";

export async function synchronizeCombatantModelsWithAppState() {
  // determine which models should exist and their positions based on game state
}

function getModelsAndPositions() {
  const state = useGameStore.getState();
  const lobbyState = useLobbyStore.getState();
  const { game } = state;
  const modelsAndPositions: { [entityId: EntityId]: Vector3 } = {};

  if (game && game.mode === GameMode.Progression && !game.timeStarted) {
    // in progression game lobby
    const partyOption = Object.values(game.adventuringParties)[0];
    if (!partyOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

    partyOption.characterPositions.forEach(
      (characterId, i) =>
        (modelsAndPositions[characterId] = new Vector3(
          -CHARACTER_SLOT_SPACING + i * CHARACTER_SLOT_SPACING,
          0,
          0
        ))
    );
  } else if (state.game && state.game.timeStarted) {
    // in game
  } else if (lobbyState.showSavedCharacterManager) {
    // viewing saved characters
  }
}
