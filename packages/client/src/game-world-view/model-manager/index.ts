import { GameWorldView } from "../index";
import { ModelActionQueue } from "./model-action-queue";
import { ModelActionHandler, createModelActionHandlers } from "./model-action-handlers";
import { ModelActionType } from "./model-actions";
import { EnvironmentModel } from "./model-action-handlers/spawn-environmental-model";
import {
  Combatant,
  CombatantId,
  ERROR_MESSAGES,
  EntityId,
  GameMode,
  MapUtils,
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
import { Quaternion, Vector3 } from "@babylonjs/core";
import { LobbyStore } from "@/mobx-stores/lobby";
import { CHARACTER_SLOT_SPACING } from "@/app/lobby/saved-character-manager";

// things involving moving models around must be handled synchronously, even though spawning
// models is async, so we'll use a queue to handle things in order

export class ModelManager {
  combatantModels = new Map<EntityId, CharacterModel>();
  environmentModels = new Map<string, EnvironmentModel>();
  modelActionQueue = new ModelActionQueue(this);
  modelActionHandlers: Record<ModelActionType, ModelActionHandler>;
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

  clearExclusive(toKeep: Set<EntityId>, options: { softCleanup: boolean }) {
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
}
