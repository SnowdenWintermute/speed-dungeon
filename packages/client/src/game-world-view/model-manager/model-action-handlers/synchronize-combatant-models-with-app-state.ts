import { CHARACTER_SLOT_SPACING } from "@/app/lobby/saved-character-manager";
import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  ERROR_MESSAGES,
  EntityId,
  GameMode,
  MapUtils,
  SpeedDungeonGame,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { Combatant } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { AppStore } from "@/mobx-stores/app-store";
import { gameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { CharacterModel } from "@/game-world-view/scene-entities/character-models";
import { spawnCharacterModel } from "./spawn-character-model";

export async function synchronizeCombatantModelsWithAppState(options: {
  placeInHomePositions?: boolean;
  softCleanup?: boolean;
  onComplete?: () => void;
}) {
  if (!gameWorldView.current) {
    return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  }
  const { modelManager } = gameWorldView.current;

  // determine which models should exist and their positions based on game state
  const modelsAndPositions = getModelsAndPositions();
  if (modelsAndPositions instanceof Error) return modelsAndPositions;

  const { gameWorldStore } = AppStore.get();

  // delete models which don't appear on the list
  modelManager.clearExclusive(new Set(modelsAndPositions.keys()), {
    softCleanup: !!options.softCleanup,
  });

  const modelSpawnPromises: Promise<Error | CharacterModel>[] = [];

  for (const [entityId, { combatant, homeLocation, homeRotation }] of modelsAndPositions) {
    const modelOption = modelManager.findOneOptional(entityId);

    if (!modelOption) {
      // start spawning model which we need to

      gameWorldStore.setModelLoading(entityId);
      modelSpawnPromises.push(
        spawnCharacterModel(
          gameWorldView.current,
          {
            combatant,
            homeRotation,
            homePosition: homeLocation,
            modelDomPositionElement: null, // vestigial from when we used to spawn directly from next.js
          },
          { spawnInDeadPose: combatant.combatantProperties.isDead() }
        )
      );
    } else {
      // move models to correct positions
      modelOption.setHomeRotation(cloneDeep(homeRotation));
      modelOption.setHomeLocation(cloneDeep(homeLocation));
      if (options.placeInHomePositions) {
        modelOption.rootTransformNode.position.copyFrom(homeLocation);
        if (modelOption.rootTransformNode.rotationQuaternion) {
          modelOption.rootTransformNode.rotationQuaternion.copyFrom(homeRotation);
        } else {
          modelOption.rootTransformNode.rotationQuaternion = cloneDeep(homeRotation);
        }
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
  if (resultsIncludedError) return new Error("Error with spawning combatant models");

  if (options.onComplete !== undefined) {
    options.onComplete();
  }
}

export type ModelsAndPositions = Map<
  EntityId,
  {
    combatant: Combatant;
    homeLocation: Vector3;
    homeRotation: Quaternion;
  }
>;

function getModelsAndPositions() {
  const { gameStore } = AppStore.get();
  const gameOption = gameStore.getGameOption();
  let modelsAndPositions: ModelsAndPositions = new Map();

  const inLobby = gameOption && gameOption.getTimeStarted() !== null;
  const inGame = gameOption && gameOption.getTimeStarted() !== null;
  if (inLobby && gameOption.mode === GameMode.Progression) {
    modelsAndPositions = getProgressionGameLobbyCombatantModelPositions(gameOption);
  } else if (inGame) {
    const party = gameStore.getExpectedParty();
    const { combatantManager } = party;
    const allCombatants = combatantManager.getAllCombatants();
    for (const combatant of allCombatants) {
      modelsAndPositions.set(combatant.entityProperties.id, {
        combatant,
        homeRotation: combatant.combatantProperties.transformProperties.homeRotation,
        homeLocation: combatant.combatantProperties.transformProperties.getHomePosition(),
      });
    }
  } else {
    const savedCharacters = AppStore.get().lobbyStore.getSavedCharacterSlots();
    // viewing saved characters
    for (const [slot, character] of iterateNumericEnumKeyedRecord(savedCharacters).filter(
      ([_slot, characterOption]) => characterOption !== null
    )) {
      if (!character) return new Error("Failed to meet checked expectation");
      modelsAndPositions.set(character.combatant.entityProperties.id, {
        combatant: character.combatant,
        homeRotation: Quaternion.Identity(),
        homeLocation: new Vector3(-CHARACTER_SLOT_SPACING + slot * CHARACTER_SLOT_SPACING, 0, 0),
      });
    }
  }

  return modelsAndPositions;
}

function getProgressionGameLobbyCombatantModelPositions(game: SpeedDungeonGame) {
  // in progression game lobby
  const partyOption = MapUtils.getFirstValue(game.adventuringParties);

  if (!partyOption) {
    throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
  }

  const modelsAndPositions: ModelsAndPositions = new Map();

  partyOption.combatantManager.getPartyMemberCharacters().forEach((combatant, i) =>
    modelsAndPositions.set(combatant.getEntityId(), {
      combatant,
      homeLocation: new Vector3(-CHARACTER_SLOT_SPACING + i * CHARACTER_SLOT_SPACING, 0, 0),
      homeRotation: Quaternion.Identity(),
    })
  );

  return modelsAndPositions;
}
