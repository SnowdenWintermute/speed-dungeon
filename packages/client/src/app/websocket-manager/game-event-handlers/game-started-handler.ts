import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { AppStore } from "@/mobx-stores/app-store";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { useGameStore } from "@/stores/game-store";
import {
  enqueueCharacterItemsForThumbnails,
  enqueueConsumableGenericThumbnailCreation,
} from "@/utils/enqueue-character-items-for-thumbnails";
import getParty from "@/utils/getParty";
import { Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export function gameStartedHandler(timeStarted: number) {
  AppStore.get().actionMenuStore.initialize(new BaseMenuState());
  console.log("game started handler ran");

  useGameStore.getState().mutateState((gameState) => {
    if (gameState.game) gameState.game.timeStarted = timeStarted;
    gameState.combatLogMessages = [
      new CombatLogMessage("A new game has begun!", CombatLogMessageStyle.Basic),
    ];

    const camera = gameWorld.current?.camera;
    if (!camera) {
      console.error("no camera found");
      return;
    }
    camera.target.copyFrom(new Vector3(-1, 0.2, 0.15));
    camera.alpha = 4.66;
    camera.beta = 1.02;
    camera.radius = 7.15;

    const partyOption = getParty(gameState.game, gameState.username || "");
    if (partyOption instanceof Error) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    const party = partyOption;
    party.dungeonExplorationManager.setCurrentFloor(gameState.game?.selectedStartingFloor || 1);

    gameWorld.current?.clearFloorTexture();

    enqueueConsumableGenericThumbnailCreation();

    const { combatantManager } = partyOption;

    for (const character of combatantManager.getAllCombatants()) {
      enqueueCharacterItemsForThumbnails(character);
    }

    combatantManager.updateHomePositions();

    console.log("trying to autofocus character");
    characterAutoFocusManager.focusFirstOwnedCharacter(gameState);
  });

  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
  });
}
