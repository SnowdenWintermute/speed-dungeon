import {
  Combatant,
  CombatantId,
  EntityId,
  GameMode,
  MapUtils,
  SpeedDungeonGame,
  invariant,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { CombatantSceneEntity } from "../scene-entities/combatants";
import { CombatantSceneEntityFactory } from "../scene-entities/combatants/factory";
import { ClientApplication } from "@/client-application";
import { GameWorldView } from "..";
import { SceneEntityLoadingStateTracker } from "./loading-state-tracker";
import { CHARACTER_SLOT_SPACING } from "@/game-world-view/game-world-view-consts";
import { SceneEntityManager } from "./base";

export class CombatantSceneEntityManager extends SceneEntityManager<CombatantSceneEntity> {
  sceneEntities = new Map<EntityId, CombatantSceneEntity>();
  factory: CombatantSceneEntityFactory;
  readonly loadingStates = new SceneEntityLoadingStateTracker();

  constructor(clientApplication: ClientApplication, gameWorldView: GameWorldView) {
    super(clientApplication, gameWorldView);
    this.factory = new CombatantSceneEntityFactory(gameWorldView, clientApplication);
  }

  updateEntities(deltaTime: number) {
    for (const [_, combatantModel] of this.sceneEntities) {
      combatantModel.highlightManager.updateHighlight();

      combatantModel.movementManager.processActiveActions(deltaTime);
      combatantModel.skeletalAnimationManager.stepAnimationTransitionWeights();
      combatantModel.skeletalAnimationManager.handleCompletedAnimations();
      combatantModel.updateDomRefPosition();

      combatantModel.targetingIndicatorManager.updateBillboardPositions();
    }
  }

  protected async onRegister(sceneEntity: CombatantSceneEntity) {
    const { combatant } = sceneEntity;
    const { combatantProperties, entityProperties } = combatant;
    const { conditionManager } = combatantProperties;

    conditionManager.getConditions().forEach((condition) => {
      const effects = condition.getCosmeticEffectWhileActive?.(entityProperties.id);
      if (!effects) return;
      this.gameWorldView.sceneEntityService.queueCosmeticEffectsStart(effects);
    });

    const { entityId } = sceneEntity;
    try {
      const portraitOption =
        await this.gameWorldView.imageGenerator.createCombatantPortrait(entityId);

      if (portraitOption) {
        this.clientApplication.imageStore.setCombatantPortrait(entityId, portraitOption);
      }

      this.loadingStates.setEntityIsLoaded(entityId);
    } catch (error) {
      console.info("some error taking portrait: ", error);
    }
  }

  /** Accepts a list of model ids to keep and despawns all others */
  private despawnCombatantModelsExclusive(
    toKeep: Set<EntityId>,
    options: { softCleanup: boolean }
  ) {
    for (const [entityId, model] of this.sceneEntities) {
      if (toKeep.has(entityId)) {
        continue;
      }

      model.cleanup({ softCleanup: !!options.softCleanup });
      this.sceneEntities.delete(entityId);
      this.pendingEntitySpawns.delete(entityId);
      this.loadingStates.clearEntityLoadingState(entityId);
    }
  }

  private getCombatantsInGameWorld() {
    const { gameOption } = this.clientApplication.gameContext;
    const inLobby = gameOption && gameOption.getTimeStarted() !== null;
    const inGame = gameOption && gameOption.getTimeStarted() !== null;
    if (inLobby && gameOption.mode === GameMode.Progression) {
      this.setProgressionGameLobbyCombatantPositions(gameOption);
      return this.getProgressionGameLobbyCombatants(gameOption);
    } else if (inGame) {
      const { partyOption } = this.clientApplication.gameContext;
      if (!partyOption) {
        return new Map();
      }
      return partyOption.combatantManager.getAllCombatants();
    } else {
      return this.getSavedCharacterSlotsCombatants();
    }
  }

  spawnOrSyncCombatantModel(combatant: Combatant, options?: { placeInHomePosition?: boolean }) {
    const entityId = combatant.getEntityId();
    const sceneEntityOption = this.getOptional(entityId);
    const { transformProperties } = combatant.combatantProperties;
    const homeLocation = transformProperties.getHomePosition();
    const homeRotation = transformProperties.homeRotation;

    if (!sceneEntityOption) {
      this.loadingStates.setEntityLoading(entityId);
      return this.factory.create(combatant, {
        spawnInDeadPose: combatant.combatantProperties.isDead(),
      });
    } else {
      return new Promise<undefined>((resolve) => {
        const { transformProperties } = sceneEntityOption.combatant.combatantProperties;
        transformProperties.setHomeRotation(homeRotation.clone());
        transformProperties.setHomePosition(homeLocation.clone());
        if (options?.placeInHomePosition) {
          sceneEntityOption.positionControls.setPosition(homeLocation);
          sceneEntityOption.positionControls.setRotation(homeRotation);
        }
        resolve(undefined);
      });
    }
  }

  async synchronizeCombatantModels(options: {
    softCleanup?: boolean;
    placeInHomePositions?: boolean;
    onComplete?: () => void;
  }) {
    const modelsAndPositions = this.getCombatantsInGameWorld();
    this.despawnCombatantModelsExclusive(new Set(modelsAndPositions.keys()), {
      softCleanup: !!options.softCleanup,
    });

    const modelSpawnPromises: Promise<CombatantSceneEntity | undefined>[] = [];

    for (const [_entityId, combatant] of modelsAndPositions) {
      modelSpawnPromises.push(
        this.spawnOrSyncCombatantModel(combatant, {
          placeInHomePosition: options.placeInHomePositions,
        })
      );
    }

    const spawnResults = await Promise.all(modelSpawnPromises);

    for (const result of spawnResults) {
      if (result === undefined) {
        // already the model exists
        continue;
      }
      this.register(result);
    }

    if (options.onComplete !== undefined) {
      options.onComplete();
    }
  }

  private getSavedCharacterSlotsCombatants() {
    const result = new Map<CombatantId, Combatant>();
    const savedCharacters = this.clientApplication.lobbyContext.savedCharacters.slots;
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

  async synchronizeCombatantEquipmentModels(combatantId: CombatantId) {
    const sceneEntity = this.requireById(combatantId);
    await sceneEntity.equipmentManager.synchronizeCombatantEquipmentModels();

    if (sceneEntity.animationControls.isIdling()) {
      sceneEntity.animationControls.startIdleAnimation(500);
    }
  }
}
