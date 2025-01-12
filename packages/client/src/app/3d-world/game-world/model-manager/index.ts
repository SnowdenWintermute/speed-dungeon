import { GameWorld } from "../index";
import { ModularCharacter } from "../../combatant-models/modular-character";
import { ModelActionQueue } from "./model-action-queue";
import { ModelActionHandler, createModelActionHandlers } from "./model-action-handlers";
import { ModelActionType } from "./model-actions";
import { EnvironmentModel } from "./model-action-handlers/spawn-environmental-model";

// things involving moving models around must be handled synchronously, even though spawning
// models is async, so we'll use a queue to handle things in order

export class ModelManager {
  combatantModels: { [entityId: string]: ModularCharacter } = {};
  environmentModels: { [modelId: string]: EnvironmentModel } = {};
  modelActionQueue = new ModelActionQueue(this);
  modelActionHandlers: Record<ModelActionType, ModelActionHandler>;
  constructor(public world: GameWorld) {
    this.modelActionHandlers = createModelActionHandlers(this);
  }
}
