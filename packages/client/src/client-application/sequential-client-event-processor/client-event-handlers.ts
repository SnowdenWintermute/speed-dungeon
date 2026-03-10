import { GameWorldView } from "@/game-world-view";
import { ClientEventHandlers, ClientEventType } from "./client-events";
import { GameStore } from "@/mobx-stores/game";
import { LobbyStore } from "@/mobx-stores/lobby";
import { CharacterModel } from "@/game-world-view/scene-entities/character-models";

export function createClientEventHandlers(
  gameStore: GameStore,
  lobbyStore: LobbyStore,
  gameWorldView: GameWorldView | null
): ClientEventHandlers {
  return {
    [ClientEventType.ClearAllModels]: () => {
      return gameWorldView?.modelManager.clearAllModels();
    },
    [ClientEventType.SynchronizeCombatantEquipmentModels]: async (event) => {
      if (gameWorldView === null) {
        return;
      }
      const modularCharacter = gameWorldView.modelManager.findOne(event.entityId);
      await modularCharacter.equipmentModelManager.synchronizeCombatantEquipmentModels();
      if (modularCharacter.isIdling()) {
        modularCharacter.startIdleAnimation(500);
      }
    },
    [ClientEventType.SynchronizeCombatantModels]: async (event) => {
      if (!gameWorldView) {
        return;
      }
      const { modelManager } = gameWorldView;

      const modelsAndPositions = modelManager.getCombatantsInGameWorld(gameStore, lobbyStore);
      modelManager.despawnCombatantModelsExclusive(new Set(modelsAndPositions.keys()), {
        softCleanup: event.softCleanup,
      });

      const modelSpawnPromises: Promise<CharacterModel>[] = [];

      for (const [_entityId, combatant] of modelsAndPositions) {
        modelSpawnPromises.push(
          modelManager.spawnOrSyncCombatantModel(combatant, {
            placeInHomePosition: event.placeInHomePositions,
          })
        );
      }

      const spawnResults = await Promise.all(modelSpawnPromises);

      for (const result of spawnResults) {
        modelManager.register(result);
      }

      if (event.onComplete !== undefined) {
        event.onComplete();
      }
    },
    [ClientEventType.SpawnEnvironmentModel]: (event) => {
      return gameWorldView?.modelManager.spawnEnvironmentModel(
        event.id,
        event.path,
        event.position,
        event.modelType,
        event.rotationQuat
      );
    },
    [ClientEventType.DespawnEnvironmentModel]: (event) => {
      gameWorldView?.modelManager.despawnEnvironmentModel(event.id);
    },
    [ClientEventType.ProcessReplayTree]: undefined,
    [ClientEventType.ProcessBattleResult]: undefined,
    [ClientEventType.PostGameMessages]: undefined,
    [ClientEventType.RemovePlayerFromGame]: undefined,
  };
}
