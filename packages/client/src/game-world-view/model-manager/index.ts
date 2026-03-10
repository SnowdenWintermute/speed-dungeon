import { GameWorldView } from "../index";
import { ModelActionQueue } from "./model-action-queue";
import { ModelActionHandler, createModelActionHandlers } from "./model-action-handlers";
import { ModelActionType } from "./model-actions";
import { EnvironmentModel } from "./model-action-handlers/spawn-environmental-model";
import {
  Combatant,
  CombatantId,
  CombatantSpecies,
  ERROR_MESSAGES,
  EntityId,
  GameMode,
  MapUtils,
  SKELETON_FILE_PATHS,
  SpeedDungeonGame,
  invariant,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { createCombatantPortrait } from "../image-manager/create-combatant-portrait";
import { setAlert } from "@/app/components/alerts";
import { AppStore } from "@/mobx-stores/app-store";
import { CharacterModel } from "../scene-entities/character-models";
import { startOrStopCosmeticEffects } from "@/replay-tree-manager/start-or-stop-cosmetic-effect";
import { GameStore } from "@/mobx-stores/game";
import {
  AssetContainer,
  Color3,
  Material,
  Quaternion,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { LobbyStore } from "@/mobx-stores/lobby";
import { CHARACTER_SLOT_SPACING } from "@/app/lobby/saved-character-manager";
import { ModelLoadingStateTracker } from "./model-loading-state-tracker";
import { CombatantModelBlueprint } from "@/singletons/next-to-babylon-message-queue";
import { importMesh } from "../game-world-view-utils";
import { getCharacterModelPartCategoriesAndAssetPaths } from "../scene-entities/character-models/modular-character-parts-model-manager/get-modular-character-parts";
import { setCharacterModelPartDefaultMaterials } from "./model-action-handlers/set-modular-character-part-default-materials";
import { MONSTER_SCALING_SIZES } from "../scene-entities/character-models/monster-scaling-sizes";
import { EnvironmentModelTypes } from "../scene-entities/environment-models/environment-model-paths";
import { LightestToDarkest, MATERIAL_NAMES, PlasticColor } from "../materials/material-colors";
import {
  HP_COLOR,
  MAIN_ACCENT_COLOR,
  MAIN_BG_COLOR,
  MAIN_TEXT_AND_BORDERS_COLOR,
} from "@/client-consts";

// things involving moving models around must be handled synchronously, even though spawning
// models is async, so we'll use a queue to handle things in order

export class ModelManager {
  combatantModels = new Map<EntityId, CharacterModel>();
  environmentModels = new Map<string, EnvironmentModel>();
  modelActionQueue = new ModelActionQueue(this);
  modelActionHandlers: Record<ModelActionType, ModelActionHandler>;
  loadingStateTracker = new ModelLoadingStateTracker();

  constructor(public world: GameWorldView) {
    this.modelActionHandlers = createModelActionHandlers(this);
  }

  async register(model: CharacterModel) {
    this.combatantModels.set(model.entityId, model);

    const character = model.getCombatant();
    const { combatantProperties, entityProperties } = character;
    const { conditionManager } = combatantProperties;

    conditionManager.getConditions().forEach((condition) => {
      startOrStopCosmeticEffects(condition.getCosmeticEffectWhileActive?.(entityProperties.id), []);
    });

    try {
      const portraitResult = createCombatantPortrait(model.entityId);

      if (portraitResult instanceof Error) {
        setAlert(portraitResult);
        throw portraitResult;
      }

      AppStore.get().gameWorldStore.setModelIsLoaded(model.entityId);
    } catch (error) {
      console.info("some error taking portrait: ", error);
    }
  }

  findOne(entityId: EntityId) {
    const modelOption = this.findOneOptional(entityId);
    if (!modelOption) {
      throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL + " " + entityId);
    }
    return modelOption;
  }

  findOneOptional(entityId: EntityId) {
    const modelOption = this.combatantModels.get(entityId);
    return modelOption;
  }

  clearAllModels() {
    for (const [_, model] of this.combatantModels) model.cleanup({ softCleanup: false });

    for (const [_, model] of this.environmentModels) {
      model.model.dispose();
    }

    this.environmentModels.clear();
    this.combatantModels.clear();
  }

  /** Accepts a list of model ids to keep and despawns all others */
  despawnCombatantModelsExclusive(toKeep: Set<EntityId>, options: { softCleanup: boolean }) {
    for (const [entityId, model] of this.combatantModels) {
      if (toKeep.has(entityId)) {
        continue;
      }

      model.cleanup({ softCleanup: !!options.softCleanup });
      this.combatantModels.delete(entityId);
      AppStore.get().gameWorldStore.clearModelLoadingState(entityId);
    }
  }

  getCombatantsInGameWorld(gameStore: GameStore, lobbyStore: LobbyStore) {
    const gameOption = gameStore.getGameOption();
    const inLobby = gameOption && gameOption.getTimeStarted() !== null;
    const inGame = gameOption && gameOption.getTimeStarted() !== null;
    if (inLobby && gameOption.mode === GameMode.Progression) {
      this.setProgressionGameLobbyCombatantPositions(gameOption);
      return this.getProgressionGameLobbyCombatants(gameOption);
    } else if (inGame) {
      return this.getAllCombatantsInParty(gameStore);
    } else {
      return this.getSavedCharacterSlotsCombatants(lobbyStore);
    }
  }

  spawnOrSyncCombatantModel(combatant: Combatant, options?: { placeInHomePosition?: boolean }) {
    const entityId = combatant.getEntityId();
    const modelOption = this.findOneOptional(entityId);
    const { transformProperties } = combatant.combatantProperties;
    const homeLocation = transformProperties.getHomePosition();
    const homeRotation = transformProperties.homeRotation;

    if (!modelOption) {
      this.loadingStateTracker.setModelLoading(entityId);
      return this.spawnCharacterModel(
        this.world,
        {
          combatant,
          homeRotation,
          homePosition: homeLocation,
          modelDomPositionElement: null,
        },
        { spawnInDeadPose: combatant.combatantProperties.isDead() }
      );
    } else {
      return new Promise<CharacterModel>((resolve) => {
        modelOption.setHomeRotation(homeRotation.clone());
        modelOption.setHomeLocation(homeLocation.clone());
        if (options?.placeInHomePosition) {
          modelOption.rootTransformNode.position.copyFrom(homeLocation);
          modelOption.setRotation(homeRotation);
        }
        resolve(modelOption);
      });
    }
  }

  private getAllCombatantsInParty(gameStore: GameStore) {
    const result = new Map<CombatantId, Combatant>();
    const party = gameStore.getExpectedParty();
    const { combatantManager } = party;
    const allCombatants = combatantManager.getAllCombatants();
    for (const combatant of allCombatants) {
      result.set(combatant.getEntityId(), combatant);
    }
    return result;
  }

  private getSavedCharacterSlotsCombatants(lobbyStore: LobbyStore) {
    const result = new Map<CombatantId, Combatant>();
    const savedCharacters = lobbyStore.getSavedCharacterSlots();
    for (const [_slot, character] of iterateNumericEnumKeyedRecord(savedCharacters).filter(
      ([_slot, characterOption]) => characterOption !== null
    )) {
      invariant(character !== null, "expected to have filtered out the null characters");
      result.set(character.combatant.getEntityId(), character.combatant);
    }
    return result;
  }

  private setProgressionGameLobbyCombatantPositions(game: SpeedDungeonGame) {
    const partyOption = MapUtils.getFirstValue(game.adventuringParties);
    invariant(
      partyOption !== undefined,
      "expected to be in a party if in a progression game lobby"
    );

    partyOption.combatantManager.getPartyMemberCharacters().forEach((combatant, i) => {
      const { transformProperties } = combatant.combatantProperties;
      transformProperties.setHomePosition(
        new Vector3(-CHARACTER_SLOT_SPACING + i * CHARACTER_SLOT_SPACING, 0, 0)
      );
      transformProperties.setHomeRotation(Quaternion.Identity());
    });
  }

  private getProgressionGameLobbyCombatants(game: SpeedDungeonGame) {
    const partyOption = MapUtils.getFirstValue(game.adventuringParties);
    invariant(
      partyOption !== undefined,
      "expected to be in a party if in a progression game lobby"
    );
    const result = new Map<CombatantId, Combatant>();

    partyOption.combatantManager.getPartyMemberCharacters().forEach((combatant) => {
      result.set(combatant.getEntityId(), combatant);
    });

    return result;
  }

  async spawnCharacterModel(
    world: GameWorldView,
    blueprint: CombatantModelBlueprint,
    options?: { spawnInDeadPose?: boolean; doNotIdle?: boolean }
  ): Promise<CharacterModel> {
    const { combatantProperties, entityProperties } = blueprint.combatant;

    const skeletonPath = SKELETON_FILE_PATHS[combatantProperties.combatantSpecies];
    const skeleton = await importMesh(skeletonPath, world.scene);

    const modularCharacter = new CharacterModel(
      entityProperties.id,
      world,
      combatantProperties.monsterType,
      combatantProperties.controlledBy.isPlayerControlled(),
      combatantProperties.classProgressionProperties.getMainClass().combatantClass,
      skeleton,
      blueprint.modelDomPositionElement,
      null,
      blueprint.homePosition,
      blueprint.homeRotation
    );

    const parts = getCharacterModelPartCategoriesAndAssetPaths(combatantProperties);
    const partPromises: Promise<AssetContainer | Error>[] = [];

    for (const part of parts) {
      const { assetPath } = part;
      if (!assetPath || assetPath === "") {
        console.error("no part asset path provided for part", part);
        continue;
      }

      partPromises.push(
        new Promise(async (resolve, _reject) => {
          const partResult = await modularCharacter.modularCharacterPartsManager.attachPart(
            part.category,
            assetPath
          );
          if (partResult instanceof Error) {
            console.error(partResult);
            return resolve(partResult);
          }

          setCharacterModelPartDefaultMaterials(partResult, combatantProperties);
          resolve(partResult);
        })
      );
    }

    const results = await Promise.all(partPromises);
    for (const result of results) {
      if (result instanceof Error) console.error(result);
    }

    if (combatantProperties.combatantSpecies === CombatantSpecies.Humanoid) {
      modularCharacter.equipmentModelManager.synchronizeCombatantEquipmentModels();
    }

    const { scaleModifier } = combatantProperties.transformProperties;
    if (combatantProperties.transformProperties.scaleModifier) {
      modularCharacter.rootTransformNode.scaling = new Vector3(
        scaleModifier,
        scaleModifier,
        scaleModifier
      );
    }

    if (modularCharacter.monsterType !== null) {
      const defaultScalingModifier = MONSTER_SCALING_SIZES[modularCharacter.monsterType];
      modularCharacter.rootTransformNode.scaling =
        modularCharacter.rootTransformNode.scaling.scale(defaultScalingModifier);
    }

    modularCharacter.updateBoundingBox();

    modularCharacter.initChildTransformNodes();

    if (options?.spawnInDeadPose) {
      modularCharacter.setToDeadPose();
    } else if (!options?.doNotIdle) {
      modularCharacter.startIdleAnimation(0, {});
    }

    modularCharacter.setVisibility(1);

    return modularCharacter;
  }

  async spawnEnvironmentModel(
    id: string,
    path: string,
    position: Vector3,
    modelType: EnvironmentModelTypes,
    rotationQuat?: Quaternion
  ) {
    try {
      const model = await importMesh(path, this.world.scene);
      this.environmentModels.set(id, new EnvironmentModel(model));
      // if (model.transformNodes[0]) model.transformNodes[0].position = action.position;
      if (model.meshes[0]) model.meshes[0].position = position;

      const oldMaterials: Material[] = [];

      if (modelType === EnvironmentModelTypes.VendingMachine) {
        for (const mesh of model.meshes) {
          const materialName = mesh.material?.name;
          if (mesh.material) oldMaterials.push(mesh.material);

          if (materialName === MATERIAL_NAMES.ACCENT_1) {
            const material = new StandardMaterial("VendingMachineAccent1");
            material.diffuseColor = Color3.FromHexString(MAIN_BG_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_NAMES.ACCENT_2) {
            const material = new StandardMaterial("VendingMachineAccent2");
            material.diffuseColor = Color3.FromHexString(MAIN_TEXT_AND_BORDERS_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_NAMES.ACCENT_3) {
            const material = new StandardMaterial("VendingMachineAccent3");
            material.diffuseColor = Color3.FromHexString(HP_COLOR);
            mesh.material = material;
          }
          if (materialName === MATERIAL_NAMES.ALTERNATE) {
            mesh.material = this.world.defaultMaterials.plastic[PlasticColor.Blue].clone("");
          }
          if (materialName === MATERIAL_NAMES.MAIN) {
            mesh.material = this.world.defaultMaterials.metal[LightestToDarkest.Darker].clone("");
          }
          if (materialName === "Dark") {
            const material = new StandardMaterial("VendingMachineDark");
            material.diffuseColor = Color3.FromHexString(MAIN_ACCENT_COLOR);
            mesh.material = material;
          }
        }
        for (const material of oldMaterials) {
          material.dispose(true, true, false);
        }
      }
    } catch (err) {
      console.trace(err);
      setAlert("Couldn't spawn environment model - check the console for error trace");
    }
  }

  despawnEnvironmentModel(id: EntityId) {
    const modelOption = this.environmentModels.get(id);
    if (modelOption) {
      modelOption.model.dispose();
      this.environmentModels.delete(id);
    }
  }
}
