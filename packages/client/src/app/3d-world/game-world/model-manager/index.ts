import { GameWorld } from "../index";
import { ModularCharacter } from "../../combatant-models/modular-character";
import { ModelActionQueue } from "./model-action-queue";
import { ModelActionHandler, createModelActionHandlers } from "./model-action-handlers";
import { ModelActionType } from "./model-actions";

// things involving moving models around must be handled synchronously, even though spawning
// models is async, so we'll use a queue to handle things in order

export class ModelManager {
  combatantModels: { [entityId: string]: ModularCharacter } = {};
  modelActionQueue = new ModelActionQueue(this);
  modelActionHandlers: Record<ModelActionType, ModelActionHandler>;
  constructor(public world: GameWorld) {
    this.modelActionHandlers = createModelActionHandlers(this);
  }

  // startProcessingNewMessages() {
  //   for (const messageQueue of Object.values(this.modelMessageQueues)) {
  //     if (messageQueue.isProcessing || messageQueue.messages.length === 0) continue;
  //     messageQueue.processMessages();
  //   }
  // }

  // enqueueMessage(entityId: string, message: ModelManagerMessage) {
  //   if (this.modelMessageQueues[entityId] === undefined)
  //     this.modelMessageQueues[entityId] = new ModelMessageQueue(this, entityId);
  //   this.modelMessageQueues[entityId]!.messages.push(message);
  // }
}
