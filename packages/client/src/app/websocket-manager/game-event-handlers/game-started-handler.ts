import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { AppStore } from "@/mobx-stores/app-store";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import {
  enqueueCharacterItemsForThumbnails,
  enqueueConsumableGenericThumbnailCreation,
} from "@/utils/enqueue-character-items-for-thumbnails";
import { Vector3 } from "@babylonjs/core";

export function gameStartedHandler(timeStarted: number) {
  console.log("game started handle ran");
  const { gameEventNotificationStore, gameStore } = AppStore.get();
  gameEventNotificationStore.clearGameLog();
  GameLogMessageService.postGameStarted();

  AppStore.get().actionMenuStore.initialize(new BaseMenuState());

  characterAutoFocusManager.focusFirstOwnedCharacter();
  console.log("after focusFirstOwnedCharacter", gameStore.getFocusedCharacterOption());

  const { game, party } = gameStore.getFocusedCharacterContext();

  game.timeStarted = timeStarted;

  const camera = gameWorld.current?.camera;
  if (!camera) {
    console.error("no camera found");
    return;
  }
  camera.target.copyFrom(new Vector3(-1, 0.2, 0.15));
  camera.alpha = 4.66;
  camera.beta = 1.02;
  camera.radius = 7.15;

  party.dungeonExplorationManager.setCurrentFloor(game.selectedStartingFloor);

  gameWorld.current?.clearFloorTexture();

  enqueueConsumableGenericThumbnailCreation();

  const { combatantManager } = party;

  for (const character of combatantManager.getAllCombatants()) {
    enqueueCharacterItemsForThumbnails(character);
  }

  combatantManager.updateHomePositions();

  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
  });
}
