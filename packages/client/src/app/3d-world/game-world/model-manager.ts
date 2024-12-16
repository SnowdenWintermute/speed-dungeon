import { GameWorld } from ".";
import { ModularCharacter } from "../combatant-models/modular-character";
import { disposeAsyncLoadedScene, importMesh } from "../utils";
import {
  CombatantClass,
  CombatantEquipment,
  CombatantSpecies,
  ERROR_MESSAGES,
  Equipment,
  EquipmentSlotType,
  HoldableSlotType,
  Item,
  MonsterType,
  TaggedEquipmentSlot,
  WearableSlotType,
  iterateNumericEnumKeyedRecord,
  removeFromArray,
} from "@speed-dungeon/common";
import {
  CHARACTER_PARTS,
  MONSTER_FULL_SKINS,
  ModularCharacterPartCategory,
  SKELETONS,
} from "../combatant-models/modular-character-parts";
import { Color3, StandardMaterial } from "@babylonjs/core";
import { CombatantModelBlueprint } from "@/singletons/next-to-babylon-message-queue";
import { useGameStore } from "@/stores/game-store";

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
          await this.modelManager.spawnCharacterModel(
            currentMessageProcessing.blueprint,
            currentMessageProcessing.checkIfRoomLoaded
          );
          break;
        case ModelManagerMessageType.DespawnModel:
          this.modelManager.despawnCharacterModel(this.entityId);
          break;
        case ModelManagerMessageType.ChangeEquipment:
          for (const slot of currentMessageProcessing.unequippedSlots)
            await this.modelManager.handleEquipmentChange(this.entityId, slot);
          if (currentMessageProcessing.toEquip)
            await this.modelManager.handleEquipmentChange(
              this.entityId,
              currentMessageProcessing.toEquip.slot,
              currentMessageProcessing.toEquip.item
            );
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

  async handleEquipmentChange(entityId: string, slot: TaggedEquipmentSlot, equipment?: Equipment) {
    const modularCharacter = this.combatantModels[entityId];
    if (!modularCharacter) return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    if (!equipment) await modularCharacter.unequipItem(slot);
    else await modularCharacter.equipItem(equipment, slot);
  }

  async spawnCharacterModel(
    blueprint: CombatantModelBlueprint,
    checkIfRoomLoaded: boolean
  ): Promise<Error | ModularCharacter> {
    const parts = [];
    const { combatantProperties, entityProperties } = blueprint.combatant;

    if (combatantProperties.monsterType !== null) {
      if (
        combatantProperties.monsterType === MonsterType.FireMage ||
        combatantProperties.monsterType === MonsterType.Cultist
      ) {
        parts.push({
          category: ModularCharacterPartCategory.Head,
          assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Head] || "",
        });
        parts.push({
          category: ModularCharacterPartCategory.Torso,
          assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Torso] || "",
        });
        parts.push({
          category: ModularCharacterPartCategory.Legs,
          assetPath: CHARACTER_PARTS[CombatantClass.Mage][ModularCharacterPartCategory.Legs] || "",
        });
      } else {
        parts.push({
          category: ModularCharacterPartCategory.Full,
          assetPath: MONSTER_FULL_SKINS[combatantProperties.monsterType] || "",
        });
      }
    } else {
      // is humanoid
      let headPath =
        CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Head];
      let torsoPath =
        CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Torso];
      let legsPath =
        CHARACTER_PARTS[combatantProperties.combatantClass][ModularCharacterPartCategory.Legs];
      parts.push({ category: ModularCharacterPartCategory.Head, assetPath: headPath });
      parts.push({ category: ModularCharacterPartCategory.Torso, assetPath: torsoPath });
      parts.push({ category: ModularCharacterPartCategory.Legs, assetPath: legsPath });
    }
    const skeleton = await importMesh(
      SKELETONS[combatantProperties.combatantSpecies],
      this.world.scene
    );

    const modularCharacter = new ModularCharacter(
      entityProperties.id,
      this.world,
      combatantProperties.monsterType,
      skeleton,
      blueprint.modelDomPositionElement,
      blueprint.startPosition,
      blueprint.startRotation,
      blueprint.modelCorrectionRotation
    );

    for (const part of parts) {
      if (!part.assetPath) {
        console.error("no part asset path provided for part", part);
        continue;
      }
      const partResult = await modularCharacter.attachPart(part.category, part.assetPath);
      if (partResult instanceof Error) return partResult;

      if (combatantProperties.monsterType === MonsterType.FireElemental)
        for (const mesh of partResult.meshes) {
          if (mesh.material?.name === "cube-material") {
            const redMaterial = new StandardMaterial("red");
            redMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
            mesh.material = redMaterial;
          }
        }

      if (combatantProperties.monsterType === MonsterType.FireMage) {
        for (const mesh of partResult.meshes) {
          if (mesh.material?.name === "Purple") {
            const redMaterial = new StandardMaterial("red");
            redMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
            mesh.material = redMaterial;
          }
        }
      }

      if (combatantProperties.monsterType === MonsterType.Cultist) {
        for (const mesh of partResult.meshes) {
          if (mesh.material?.name === "Purple") {
            const whiteMaterial = new StandardMaterial("white");
            whiteMaterial.diffuseColor = new Color3(0.85, 0.75, 0.75);
            mesh.material = whiteMaterial;
          }
        }
      }
    }

    if (combatantProperties.combatantSpecies === CombatantSpecies.Humanoid) {
      for (const [slot, item] of iterateNumericEnumKeyedRecord(
        combatantProperties.equipment.wearables
      )) {
        await modularCharacter.equipItem(item, {
          type: EquipmentSlotType.Wearable,
          slot: slot,
        });
      }

      const equippedHoldables = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
      if (equippedHoldables)
        for (const [slot, item] of iterateNumericEnumKeyedRecord(equippedHoldables.holdables)) {
          await modularCharacter.equipItem(item, {
            type: EquipmentSlotType.Holdable,
            slot,
          });
        }
    }

    this.combatantModels[entityProperties.id] = modularCharacter;

    modularCharacter.updateBoundingBox();

    if (checkIfRoomLoaded) this.checkIfAllModelsInCurrentRoomAreLoaded();

    useGameStore.getState().mutateState((state) => {
      removeFromArray(state.combatantModelsAwaitingSpawn, entityProperties.id);
    });

    return modularCharacter;
  }

  despawnCharacterModel(entityId: string): Error | void {
    const toRemove = this.combatantModels[entityId];
    if (!toRemove) return new Error("tried to remove a combatant model that doesn't exist");
    toRemove.rootTransformNode.dispose();
    disposeAsyncLoadedScene(toRemove.skeleton, this.world.scene);
    for (const part of Object.values(toRemove.parts)) {
      disposeAsyncLoadedScene(part, this.world.scene);
    }

    toRemove.modelActionManager.removeActiveModelAction();

    delete this.combatantModels[entityId];
  }

  checkIfAllModelsInCurrentRoomAreLoaded() {
    useGameStore.getState().mutateState((gameState) => {
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
      for (const monsterId of party.currentRoom.monsterPositions) {
        if (!this.combatantModels[monsterId]) {
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
  ChangeEquipment,
}

type SpawnCombatantModelManagerMessage = {
  type: ModelManagerMessageType.SpawnModel;
  blueprint: CombatantModelBlueprint;
  checkIfRoomLoaded: boolean;
};

type DespawnModelManagerMessage = {
  type: ModelManagerMessageType.DespawnModel;
};

type ChangeEquipmentModelManagerMessage = {
  type: ModelManagerMessageType.ChangeEquipment;
  unequippedSlots: TaggedEquipmentSlot[];
  toEquip?: { item: Item; slot: TaggedEquipmentSlot };
};

type ModelManagerMessage =
  | SpawnCombatantModelManagerMessage
  | DespawnModelManagerMessage
  | ChangeEquipmentModelManagerMessage;
