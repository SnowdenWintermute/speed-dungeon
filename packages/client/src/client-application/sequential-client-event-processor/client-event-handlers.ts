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
      if (gameWorldView === null) {
        return;
      }
      const { modelManager } = gameWorldView;
      modelManager.clearAllModels();
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

      // determine which models should exist and their positions based on game state
      const modelsAndPositions = modelManager.getCombatantsInGameWorld(gameStore, lobbyStore);
      // delete models which don't appear on the list
      modelManager.clearExclusive(new Set(modelsAndPositions.keys()), {
        softCleanup: event.softCleanup,
      });

      const modelSpawnPromises: Promise<CharacterModel>[] = [];

      for (const [entityId, combatant] of modelsAndPositions) {
        const modelOption = modelManager.findOneOptional(entityId);
        const { transformProperties } = combatant.combatantProperties;
        const homeLocation = transformProperties.getHomePosition();
        const homeRotation = transformProperties.homeRotation;

        if (!modelOption) {
          // start spawning model which we need to

          gameWorldStore.setModelLoading(entityId);
          modelSpawnPromises.push(
            spawnCharacterModel(
              gameWorldView,
              {
                combatant,
                homeRotation,
                homePosition: homeLocation,
              },
              { spawnInDeadPose: combatant.combatantProperties.isDead() }
            )
          );
        } else {
          modelOption.setHomeRotation(homeRotation.clone());
          modelOption.setHomeLocation(homeLocation.clone());
          if (event.placeInHomePositions) {
            modelOption.rootTransformNode.position.copyFrom(homeLocation);
            modelOption.setRotation(homeRotation);
          }
        }
      }

      const spawnResults = await Promise.all(modelSpawnPromises);
      let resultsIncludedError = false;

      for (const result of spawnResults) {
        if (result instanceof Error) {
          console.error(result);
          resultsIncludedError = true;
        } else {
          modelManager.register(result);
        }
      }

      if (resultsIncludedError) {
        console.error("Error with spawning combatant models");
      }

      if (event.onComplete !== undefined) {
        event.onComplete();
      }
    },
    [ClientEventType.SpawnEnvironmentModel]: undefined,
    [ClientEventType.DespawnEnvironmentModel]: undefined,
    [ClientEventType.ProcessReplayTree]: undefined,
    [ClientEventType.ProcessBattleResult]: undefined,
    [ClientEventType.PostGameMessages]: undefined,
    [ClientEventType.RemovePlayerFromGame]: undefined,
  };
}
