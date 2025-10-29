import { gameWorld } from "@/app/3d-world/SceneManager";
import { CHARACTER_SLOT_SPACING } from "@/app/lobby/saved-character-manager";
import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  ERROR_MESSAGES,
  EntityId,
  GameMode,
  SpeedDungeonGame,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { Combatant } from "@speed-dungeon/common";
import { spawnCharacterModel } from "./spawn-modular-character";
import { setAlert } from "@/app/components/alerts";
import cloneDeep from "lodash.clonedeep";
import { createCombatantPortrait } from "../../image-manager/create-combatant-portrait";
import { CharacterModel } from "@/app/3d-world/scene-entities/character-models";
import { startOrStopCosmeticEffects } from "../../replay-tree-manager/start-or-stop-cosmetic-effect";
import { AppStore } from "@/mobx-stores/app-store";

export async function synchronizeCombatantModelsWithAppState() {
  if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  const { modelManager } = gameWorld.current;

  // determine which models should exist and their positions based on game state
  const modelsAndPositions = getModelsAndPositions();
  if (modelsAndPositions instanceof Error) return modelsAndPositions;

  const { gameWorldStore } = AppStore.get();

  // delete models which don't appear on the list
  for (const [entityId, model] of Object.entries(modelManager.combatantModels)) {
    if (!modelsAndPositions[entityId]) {
      model.cleanup({ softCleanup: false });
      delete modelManager.combatantModels[entityId];
      gameWorldStore.clearModelLoadingState(entityId);
    }
  }

  const modelSpawnPromises: Promise<Error | CharacterModel>[] = [];

  for (const [entityId, { combatant, homeLocation, homeRotation }] of Object.entries(
    modelsAndPositions
  )) {
    const modelOption = modelManager.combatantModels[entityId];

    if (!modelOption) {
      // start spawning model which we need to

      gameWorldStore.setModelLoading(entityId);
      modelSpawnPromises.push(
        spawnCharacterModel(gameWorld.current, {
          combatant,
          homeRotation,
          homePosition: homeLocation,
          modelDomPositionElement: null, // vestigial from when we used to spawn directly from next.js
        })
      );
    } else {
      // move models to correct positions
      modelOption.setHomeRotation(cloneDeep(homeRotation));
      modelOption.setHomeLocation(cloneDeep(homeLocation));
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

      const character = result.getCombatant();
      const { combatantProperties, entityProperties } = character;
      const { conditionManager } = combatantProperties;

      conditionManager.getConditions().forEach((condition) => {
        startOrStopCosmeticEffects(condition.getCosmeticEffectWhileActive(entityProperties.id), []);
      });

      const portraitResult = await createCombatantPortrait(result.entityId);
      if (portraitResult instanceof Error) setAlert(portraitResult);

      gameWorldStore.setModelIsLoaded(result.entityId);
    }
  }
  if (resultsIncludedError) return new Error("Error with spawning combatant models");
}

interface ModelsAndPositions {
  [entityId: EntityId]: {
    combatant: Combatant;
    homeLocation: Vector3;
    homeRotation: Quaternion;
  };
}

function getModelsAndPositions() {
  const { gameStore } = AppStore.get();
  const gameOption = gameStore.getGameOption();
  let modelsAndPositions: ModelsAndPositions = {};

  const inLobby = gameOption && !gameOption.timeStarted;
  const inGame = gameOption && gameOption.timeStarted;
  if (inLobby && gameOption.mode === GameMode.Progression) {
    modelsAndPositions = getProgressionGameLobbyCombatantModelPositions(gameOption);
  } else if (inGame) {
    const party = gameStore.getExpectedParty();
    const { combatantManager } = party;
    for (const combatant of combatantManager.getAllCombatants()) {
      console.log(
        "GETTING COMBATANT POSITION:",
        combatant.combatantProperties.transformProperties.homePosition
      );
      modelsAndPositions[combatant.entityProperties.id] = {
        combatant,
        homeRotation: combatant.combatantProperties.transformProperties.homeRotation,
        homeLocation: combatant.combatantProperties.transformProperties.homePosition,
      };
    }
  } else {
    const savedCharacters = AppStore.get().lobbyStore.getSavedCharacterSlots();
    // viewing saved characters
    for (const [slot, character] of iterateNumericEnumKeyedRecord(savedCharacters).filter(
      ([_slot, characterOption]) => characterOption !== null
    )) {
      if (!character) return new Error("Failed to meet checked expectation");
      modelsAndPositions[character.entityProperties.id] = {
        combatant: character,
        homeRotation: Quaternion.Identity(),
        homeLocation: new Vector3(-CHARACTER_SLOT_SPACING + slot * CHARACTER_SLOT_SPACING, 0, 0),
      };
    }
  }

  return modelsAndPositions;
}

function getProgressionGameLobbyCombatantModelPositions(game: SpeedDungeonGame) {
  // in progression game lobby
  const partyOption = Object.values(game.adventuringParties)[0];
  if (!partyOption) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

  const modelsAndPositions: ModelsAndPositions = {};

  partyOption.combatantManager.getPartyMemberCharacters().forEach(
    (combatant, i) =>
      (modelsAndPositions[combatant.getEntityId()] = {
        combatant,
        homeLocation: new Vector3(-CHARACTER_SLOT_SPACING + i * CHARACTER_SLOT_SPACING, 0, 0),
        homeRotation: Quaternion.Identity(),
      })
  );

  return modelsAndPositions;
}
