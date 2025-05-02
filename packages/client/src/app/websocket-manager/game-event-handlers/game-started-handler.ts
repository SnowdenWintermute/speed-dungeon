import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { useGameStore } from "@/stores/game-store";
import {
  enqueueCharacterItemsForThumbnails,
  enqueueConsumableGenericThumbnailCreation,
} from "@/utils/enqueue-character-items-for-thumbnails";
import getParty from "@/utils/getParty";
import { Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES, updateCombatantHomePosition } from "@speed-dungeon/common";

export function gameStartedHandler(timeStarted: number) {
  useGameStore.getState().mutateState((gameState) => {
    if (gameState.game) gameState.game.timeStarted = timeStarted;
    gameState.combatLogMessages = [
      new CombatLogMessage("A new game has begun!", CombatLogMessageStyle.Basic),
    ];

    const camera = gameWorld.current?.camera;
    if (!camera) return;
    camera.target.copyFrom(new Vector3(-1, 0.2, 0.15));
    camera.alpha = 4.66;
    camera.beta = 1.02;
    camera.radius = 7.15;

    const partyOption = getParty(gameState.game, gameState.username || "");
    if (partyOption instanceof Error) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    const party = partyOption;
    party.currentFloor = gameState.game?.selectedStartingFloor || 1;
    // party.currentFloor = 10; // testing

    gameWorld.current?.clearFloorTexture();

    enqueueConsumableGenericThumbnailCreation();

    for (const character of Object.values(partyOption.characters)) {
      updateCombatantHomePosition(
        character.entityProperties.id,
        character.combatantProperties,
        party
      );
      enqueueCharacterItemsForThumbnails(character);
    }
  });

  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
  });
}
