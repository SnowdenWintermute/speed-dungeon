import { CombatantModelBlueprint } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { GameWorld } from ".";
import { ModularCharacter } from "../combatant-models/modular-character";
import { disposeAsyncLoadedScene } from "../utils";
import { CombatantSpecies, removeFromArray } from "@speed-dungeon/common";
import {
  CHARACTER_PARTS,
  MONSTER_FULL_SKINS,
  ModularCharacterPartCategory,
  SKELETONS,
} from "../combatant-models/modular-character-parts";

// the whole point of all this is to make sure we never handle spawn and despawn messages out of order due
// to the asynchronous nature of spawning models
//
class ModelMessageQueue {
  isProcessing: boolean = false;
  messages: ModelManagerMessage[] = [];
  constructor(
    public modelManager: ModelManager,
    public entityId: string
  ) {}

  async processMessages() {
    this.isProcessing = true;

    let currentMessageProcessing = this.messages.shift();
    while (currentMessageProcessing) {
      switch (currentMessageProcessing.type) {
        case ModelManagerMessageType.SpawnModel:
          await this.modelManager.spawnCharacterModel(currentMessageProcessing.blueprint);
          break;
        case ModelManagerMessageType.DespawnModel:
          this.modelManager.despawnCharacterModel(this.entityId);
          break;
      }
      currentMessageProcessing = this.messages.shift();
    }

    this.isProcessing = false;
  }
}

export class ModelManager {
  combatantModels: { [entityId: string]: ModularCharacter } = {};
  modelMessageQueues: {
    [entityId: string]: ModelMessageQueue;
  } = {};
  constructor(public world: GameWorld) {}

  startProcessingNewMessages() {
    for (const messageQueue of Object.values(this.modelMessageQueues)) {
      if (messageQueue.isProcessing || messageQueue.messages.length === 0) continue;
      messageQueue.processMessages();
    }
  }

  enqueueMessage(entityId: string, message: ModelManagerMessage) {
    if (this.modelMessageQueues[entityId] === undefined)
      this.modelMessageQueues[entityId] = new ModelMessageQueue(this, entityId);
    this.modelMessageQueues[entityId]!.messages.push(message);
  }

  async spawnCharacterModel(blueprint: CombatantModelBlueprint): Promise<ModularCharacter> {
    const parts = [];
    if (blueprint.monsterType !== null) {
      parts.push({
        category: ModularCharacterPartCategory.Full,
        assetPath: MONSTER_FULL_SKINS[blueprint.monsterType] || "",
      });
    } else {
      // is humanoid
      let headPath = CHARACTER_PARTS[blueprint.class][ModularCharacterPartCategory.Head] || "";
      let torsoPath = CHARACTER_PARTS[blueprint.class][ModularCharacterPartCategory.Torso] || "";
      let legsPath = CHARACTER_PARTS[blueprint.class][ModularCharacterPartCategory.Legs] || "";
      parts.push({ category: ModularCharacterPartCategory.Head, assetPath: headPath });
      parts.push({ category: ModularCharacterPartCategory.Torso, assetPath: torsoPath });
      parts.push({ category: ModularCharacterPartCategory.Legs, assetPath: legsPath });
    }
    const skeleton = await this.world.importMesh(SKELETONS[blueprint.species]!);

    const modularCharacter = new ModularCharacter(
      blueprint.entityId,
      this.world,
      blueprint.monsterType,
      skeleton,
      blueprint.modelDomPositionElement,
      blueprint.startPosition,
      blueprint.startRotation,
      blueprint.modelCorrectionRotation
    );

    for (const part of parts) {
      await modularCharacter.attachPart(part.category, part.assetPath);
    }

    if (blueprint.species === CombatantSpecies.Humanoid)
      await modularCharacter.equipWeapon("", false);
    if (blueprint.species === CombatantSpecies.Humanoid)
      await modularCharacter.equipWeapon("", true);

    this.combatantModels[blueprint.entityId] = modularCharacter;

    modularCharacter.updateBoundingBox();

    this.checkIfAllModelsInCurrentRoomAreLoaded();

    this.world.mutateGameState((state) => {
      removeFromArray(state.combatantModelsAwaitingSpawn, blueprint.entityId);
    });

    return modularCharacter;
  }

  despawnCharacterModel(entityId: string): Error | void {
    const toRemove = this.combatantModels[entityId];
    if (!toRemove) return new Error("tried to remove a combatant model that doesn't exist");
    toRemove.rootTransformNode.dispose();
    disposeAsyncLoadedScene(toRemove.skeleton);
    for (const part of Object.values(toRemove.parts)) {
      disposeAsyncLoadedScene(part);
    }

    toRemove.modelActionManager.removeActiveModelAction();

    delete this.combatantModels[entityId];
  }

  checkIfAllModelsInCurrentRoomAreLoaded() {
    this.world.mutateGameState((gameState) => {
      const partyResult = gameState.getParty();
      if (partyResult instanceof Error) return console.error(partyResult);
      const party = partyResult;
      let allModelsLoaded = true;
      for (const characterId of party.characterPositions) {
        if (!this.combatantModels[characterId]) {
          allModelsLoaded = false;
          break;
        }
      }
      for (const monster of Object.values(party.currentRoom.monsters)) {
        if (!this.combatantModels[monster.entityProperties.id]) {
          allModelsLoaded = false;
          break;
        }
      }

      this.world.currentRoomLoaded = allModelsLoaded;
    });
  }
}

export enum ModelManagerMessageType {
  SpawnModel,
  DespawnModel,
}

type SpawnCombatantModelManagerMessage = {
  type: ModelManagerMessageType.SpawnModel;
  blueprint: CombatantModelBlueprint;
};

type DespawnModelManagerMessage = {
  type: ModelManagerMessageType.DespawnModel;
};

type ModelManagerMessage = SpawnCombatantModelManagerMessage | DespawnModelManagerMessage;
