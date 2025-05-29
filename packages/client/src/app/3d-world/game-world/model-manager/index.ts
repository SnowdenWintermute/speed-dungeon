import { GameWorld } from "../index";
import { ModelActionQueue } from "./model-action-queue";
import { ModelActionHandler, createModelActionHandlers } from "./model-action-handlers";
import { ModelActionType } from "./model-actions";
import { EnvironmentModel } from "./model-action-handlers/spawn-environmental-model";
import { disposeAsyncLoadedScene } from "../../utils";
import { CharacterModel } from "../../scene-entities/character-models";
import { ERROR_MESSAGES, EntityId } from "@speed-dungeon/common";

// things involving moving models around must be handled synchronously, even though spawning
// models is async, so we'll use a queue to handle things in order

export class ModelManager {
  combatantModels: { [entityId: string]: CharacterModel } = {};
  environmentModels: { [modelId: string]: EnvironmentModel } = {};
  modelActionQueue = new ModelActionQueue(this);
  modelActionHandlers: Record<ModelActionType, ModelActionHandler>;
  constructor(public world: GameWorld) {
    this.modelActionHandlers = createModelActionHandlers(this);
  }

  findOne(entityId: EntityId) {
    const modelOption = this.combatantModels[entityId];
    if (!modelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    return modelOption;
  }

  findOneOptional(entityId: EntityId) {
    const modelOption = this.combatantModels[entityId];
    return modelOption;
  }

  clearAllModels() {
    for (const model of Object.values(this.combatantModels)) model.cleanup({ softCleanup: false });

    for (const model of Object.values(this.environmentModels)) {
      disposeAsyncLoadedScene(model.model);
    }
    this.environmentModels = {};
    this.combatantModels = {};
  }
}
