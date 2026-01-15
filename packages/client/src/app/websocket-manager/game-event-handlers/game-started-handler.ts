import { gameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import {
  enqueueCharacterItemsForThumbnails,
  enqueueConsumableGenericThumbnailCreation,
} from "@/utils/enqueue-character-items-for-thumbnails";
import { Vector3 } from "@babylonjs/core";

export function gameStartedHandler(timeStarted: number) {
  const { gameEventNotificationStore, gameStore } = AppStore.get();
  gameEventNotificationStore.clearGameLog();
  GameLogMessageService.postGameStarted();

  AppStore.get().actionMenuStore.initialize(new BaseMenuState());

  characterAutoFocusManager.focusFirstOwnedCharacter();

  const { game, party } = gameStore.getFocusedCharacterContext();

  game.setAsStarted();

  const camera = gameWorldView.current?.camera;
  if (!camera) {
    console.error("no camera found");
    return;
  }
  camera.target.copyFrom(new Vector3(-1, 0.85, 0.51));
  camera.alpha = 4.7;
  camera.beta = 1.06;
  camera.radius = 10.94;

  party.dungeonExplorationManager.setCurrentFloor(game.selectedStartingFloor);

  gameWorldView.current?.clearFloorTexture();

  enqueueConsumableGenericThumbnailCreation();

  const { combatantManager } = party;

  for (const character of combatantManager.getAllCombatants()) {
    enqueueCharacterItemsForThumbnails(character);
  }

  combatantManager.updateHomePositions();
  combatantManager.setAllCombatantsToHomePositions();

  gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
    placeInHomePositions: true,
  });
}
