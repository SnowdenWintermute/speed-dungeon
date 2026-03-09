import { GameWorldView } from "../index";
import { ModelActionQueue } from "./model-action-queue";
import { ModelActionHandler, createModelActionHandlers } from "./model-action-handlers";
import { ModelActionType } from "./model-actions";
import { EnvironmentModel } from "./model-action-handlers/spawn-environmental-model";
import { ERROR_MESSAGES, EntityId } from "@speed-dungeon/common";
import { createCombatantPortrait } from "../image-manager/create-combatant-portrait";
import { setAlert } from "@/app/components/alerts";
import { AppStore } from "@/mobx-stores/app-store";
import { CharacterModel } from "../scene-entities/character-models";
import { startOrStopCosmeticEffects } from "@/replay-tree-manager/start-or-stop-cosmetic-effect";

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
}
