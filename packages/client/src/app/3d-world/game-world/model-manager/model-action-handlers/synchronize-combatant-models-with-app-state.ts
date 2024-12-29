import { gameWorld } from "@/app/3d-world/SceneManager";
import { CHARACTER_SLOT_SPACING } from "@/app/lobby/saved-character-manager";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import getParty from "@/utils/getParty";
import { Vector3 } from "@babylonjs/core";
import {
  ERROR_MESSAGES,
  EntityId,
  GameMode,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { Combatant, cloneVector3 } from "@speed-dungeon/common";
import { despawnModularCharacter } from "./despawn-modular-character";
import { spawnModularCharacter } from "./spawn-modular-character";
import { ModularCharacter } from "@/app/3d-world/combatant-models/modular-character";

export async function synchronizeCombatantModelsWithAppState() {
  if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  const { modelManager } = gameWorld.current;
  // determine which models should exist and their positions based on game state
  const modelsAndPositions = getModelsAndPositions();
  if (modelsAndPositions instanceof Error) return modelsAndPositions;
  // delete models which don't appear on the list
  for (const [entityId, model] of Object.entries(modelManager.combatantModels)) {
    if (!modelsAndPositions[entityId]) {
      const maybeError = despawnModularCharacter(gameWorld.current, model);
      if (maybeError instanceof Error) return maybeError;
      delete modelManager.combatantModels[entityId];
      useGameStore.getState().mutateState((state) => {
        delete state.combatantModelLoadingStates[entityId];
      });
    }
  }

  const modelSpawnPromises: Promise<Error | ModularCharacter>[] = [];

  for (const [entityId, { combatant, position }] of Object.entries(modelsAndPositions)) {
    const modelOption = modelManager.combatantModels[entityId];
    if (!modelOption) {
      // start spawning model which we need to

      useGameStore.getState().mutateState((state) => {
        state.combatantModelLoadingStates[entityId] = true;
      });
      modelSpawnPromises.push(
        spawnModularCharacter(gameWorld.current, {
          combatant,
          startPosition: position.startPosition,
          startRotation: position.startRotation,
          modelCorrectionRotation: position.modelCorrectionRotation,
          modelDomPositionElement: null, // vestigial from when we used to spawn directly from next.js
        })
      );
    } else {
      // move models to correct positions
      modelOption.setHomeLocation(position.startPosition);
      modelOption.setHomeRotation(position.startRotation);
    }
  }

  const spawnResults = await Promise.all(modelSpawnPromises);
  let resultsIncludedError = false;
  for (const result of spawnResults) {
    if (result instanceof Error) {
      console.error(result);
      resultsIncludedError = true;
    } else {
      modelManager.combatantModels[result.entityId] = result;
      useGameStore.getState().mutateState((state) => {
        state.combatantModelLoadingStates[result.entityId] = false;
      });
    }
  }
  if (resultsIncludedError) return new Error("Error with spawning combatant models");
}

function getModelsAndPositions() {
  const state = useGameStore.getState();
  const lobbyState = useLobbyStore.getState();
  const { game } = state;
  const modelsAndPositions: {
    [entityId: EntityId]: {
      combatant: Combatant;
      position: {
        startRotation: number;
        modelCorrectionRotation: number;
        startPosition: Vector3;
      };
    };
  } = {};

  if (game && game.mode === GameMode.Progression && !game.timeStarted) {
    // in progression game lobby
    const partyOption = Object.values(game.adventuringParties)[0];
    if (!partyOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

    partyOption.characterPositions.forEach(
      (characterId, i) =>
        (modelsAndPositions[characterId] = {
          combatant: partyOption.characters[characterId]!,
          position: {
            startPosition: new Vector3(-CHARACTER_SLOT_SPACING + i * CHARACTER_SLOT_SPACING, 0, 0),
            modelCorrectionRotation: 0,
            startRotation: 0,
          },
        })
    );
  } else if (state.game && state.game.timeStarted) {
    // in game
    const partyResult = getParty(game, state.username || "");
    if (partyResult instanceof Error) return partyResult;
    for (const character of Object.values(partyResult.characters)) {
      modelsAndPositions[character.entityProperties.id] = {
        combatant: character,
        position: getCombatantModelStartPosition(character),
      };
    }
    for (const monster of Object.values(partyResult.currentRoom.monsters)) {
      modelsAndPositions[monster.entityProperties.id] = {
        combatant: monster,
        position: getCombatantModelStartPosition(monster),
      };
    }
  } else {
    const savedCharacters = lobbyState.savedCharacters;
    console.log("saved characters:", savedCharacters);
    // viewing saved characters
    for (const [slot, character] of iterateNumericEnumKeyedRecord(savedCharacters).filter(
      ([_slot, characterOption]) => characterOption !== null
    )) {
      if (!character) return new Error("Failed to meet checked expectation");
      modelsAndPositions[character.entityProperties.id] = {
        combatant: character,
        position: {
          startRotation: 0,
          modelCorrectionRotation: 0,
          startPosition: new Vector3(-CHARACTER_SLOT_SPACING + slot * CHARACTER_SLOT_SPACING, 0, 0),
        },
      };
    }
  }

  return modelsAndPositions;
}

function getCombatantModelStartPosition(combatant: Combatant) {
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
