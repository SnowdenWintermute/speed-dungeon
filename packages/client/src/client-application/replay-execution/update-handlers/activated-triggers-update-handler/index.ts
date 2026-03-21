import {
  ActionEntity,
  ActionEntityActionOriginData,
  ActionEntityName,
  ActionPayableResource,
  ActivatedTriggersGameUpdateCommand,
  AdventuringParty,
  Battle,
  COMBAT_ACTIONS,
  CleanupMode,
  CombatantClass,
  CombatantCondition,
  DurabilityChangesByEntityId,
  EntityId,
  EntityName,
  EquipmentSlotType,
  HitOutcome,
  HitPointChanges,
  PetSlot,
  SerializedOf,
  SkeletalAnimationName,
  SpeedDungeonGame,
  deserializeCondition,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { handleThreatChangesUpdate } from "./threat-changes";
import { ClientApplication } from "@/client-application";
import { ReplayGameUpdateTracker } from "../../replay-game-update-completion-tracker";
import { CombatantResourceChangeUpdateHandlerCommand } from "../resource-change-update-handler-command";
import { GameWorldView } from "@/game-world-view";

export class ActionEffectsApplyerCommand {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  battleOption: Battle | null;
  gameWorldView: GameWorldView | null;
  constructor(
    private clientApplication: ClientApplication,
    private update: ReplayGameUpdateTracker<ActivatedTriggersGameUpdateCommand>
  ) {
    const context = clientApplication.combatantFocus.requireFocusedCharacterContext();
    this.game = context.game;
    this.party = context.party;
    this.battleOption = this.party.getBattleOption(this.game);
    this.gameWorldView = this.clientApplication.gameWorldView;
  }
  execute() {
    const { command } = this.update;
    this.applySupportClassLevelsGained(command.supportClassLevelsGained);
    this.applyConditionStacksRemoved(command.removedConditionStacks);
    this.applyConditionsRemoved(command.removedConditionIds);
    this.applyPetSlotsUnsummoned(command.petsUnsummoned);
    this.applyPetsTamed(command.petsTamed);
    this.applyPetSlotsSummoned(command.petSlotsSummoned);
    this.applyPetSlotsReleased(command.petSlotsReleased);
    this.applyHitPointChanges(command);
    this.applyDurabilityChanges(command.durabilityChanges);
    this.applyConditions(command.appliedConditions);
    this.applyActionEntityChanges(command.actionEntityChanges);
    handleThreatChangesUpdate(this.clientApplication, command);

    // must despawn AFTER startOrStopCosmeticEffects so we can do a little puff of smoke
    // on an entity right before we despawn it
    this.applyDespawnedActionEntities(command.actionEntityIdsDespawned);
    this.applyActionEntitiesHidden(command.actionEntityIdsToHide);

    this.update.setAsQueuedToComplete();
  }

  private applySupportClassLevelsGained(supportClassLevelsGained?: Record<string, CombatantClass>) {
    if (!supportClassLevelsGained) return;

    for (const [entityId, combatantClass] of Object.entries(supportClassLevelsGained)) {
      const combatantResult = this.party.combatantManager.getExpectedCombatant(entityId);
      const { combatantProperties } = combatantResult;
      combatantProperties.classProgressionProperties.incrementSupportClassLevel(combatantClass);
    }
  }

  private applyConditionStacksRemoved(
    removedConditionStacks:
      | undefined
      | Record<
          string,
          {
            conditionId: EntityId;
            numStacks: number;
          }[]
        >
  ) {
    if (!removedConditionStacks) return;

    const { gameWorldView } = this.clientApplication;

    for (const [entityId, conditionIdAndStacks] of Object.entries(removedConditionStacks)) {
      for (const { conditionId, numStacks } of conditionIdAndStacks) {
        const combatantResult = this.party.combatantManager.getExpectedCombatant(entityId);

        const { conditionManager } = combatantResult.combatantProperties;
        const conditionRemovedOption = conditionManager.removeStacks(conditionId, numStacks);

        if (!gameWorldView) {
          continue;
        }

        if (conditionRemovedOption) {
          const targetModelOption =
            gameWorldView.sceneEntityService.combatantSceneEntityManager.requireById(entityId);

          gameWorldView.sceneEntityService.startOrStopCosmeticEffects(
            [],
            conditionRemovedOption.getCosmeticEffectWhileActive?.(targetModelOption.entityId)
          );
        }
      }
    }
  }

  private applyConditionsRemoved(removedConditionIds?: Record<string, string[]>) {
    if (!removedConditionIds) return;

    const { gameWorldView } = this.clientApplication;
    for (const [entityId, conditionIdsRemoved] of Object.entries(removedConditionIds)) {
      for (const conditionId of conditionIdsRemoved) {
        const combatantResult = this.party.combatantManager.getExpectedCombatant(entityId);

        const { conditionManager } = combatantResult.combatantProperties;
        const conditionRemovedOption = conditionManager.removeConditionById(conditionId);

        if (!gameWorldView) {
          continue;
        }

        if (conditionRemovedOption) {
          const targetModelOption =
            gameWorldView.sceneEntityService.combatantSceneEntityManager.requireById(entityId);
          gameWorldView.sceneEntityService.startOrStopCosmeticEffects(
            [],
            conditionRemovedOption.getCosmeticEffectWhileActive?.(targetModelOption.entityId)
          );
        }
      }
    }
  }

  private applyPetSlotsUnsummoned(petsUnsummoned?: EntityId[]) {
    if (!petsUnsummoned) return;

    const { petManager, combatantManager } = this.party;

    for (const petId of petsUnsummoned) {
      const pet = combatantManager.getExpectedCombatant(petId);
      petManager.unsummonPet(petId, this.game);

      const combatantSceneEntityManager =
        this.gameWorldView?.sceneEntityService.combatantSceneEntityManager;
      if (!combatantSceneEntityManager) continue;

      if (pet.combatantProperties.isDead()) {
        combatantSceneEntityManager.synchronizeCombatantModels({
          softCleanup: true,
        });
      } else {
        const modelOption = combatantSceneEntityManager.requireById(petId);
        modelOption?.skeletalAnimationManager.startAnimationWithTransition(
          SkeletalAnimationName.OnSummoned,
          500,
          {
            onComplete: () => {
              combatantSceneEntityManager.synchronizeCombatantModels({
                softCleanup: true,
              });
            },
          }
        );
      }
    }
  }

  private applyPetsTamed(petsTamed?: { petId: EntityId; tamerId: EntityId }[]) {
    if (!petsTamed) return;

    for (const { petId, tamerId } of petsTamed) {
      this.party.petManager.handlePetTamed(petId, tamerId, this.game);

      const combatantSceneEntityManager =
        this.gameWorldView?.sceneEntityService.combatantSceneEntityManager;
      if (!combatantSceneEntityManager) continue;

      const modelOption = combatantSceneEntityManager.getOptional(petId);
      modelOption?.skeletalAnimationManager.startAnimationWithTransition(
        SkeletalAnimationName.OnSummoned,
        500,
        {
          onComplete: () => {
            combatantSceneEntityManager.synchronizeCombatantModels({ softCleanup: true });
          },
        }
      );
    }
  }

  private applyPetSlotsSummoned(petSlotsSummoned?: PetSlot[]) {
    if (!petSlotsSummoned) return;

    for (const { ownerId, slotIndex } of petSlotsSummoned) {
      const pet = this.party.petManager.summonPetFromSlot(
        this.game,
        this.party,
        ownerId,
        slotIndex,
        this.battleOption
      );

      if (pet === undefined) {
        this.clientApplication.alertsService.setAlert(
          "No pet was found even though server thought there should have been one"
        );
        return;
      }

      const combatantSceneEntityManager =
        this.gameWorldView?.sceneEntityService.combatantSceneEntityManager;
      if (!combatantSceneEntityManager) continue;

      combatantSceneEntityManager.synchronizeCombatantModels({
        onComplete: () => {
          const modelOption = combatantSceneEntityManager.requireById(pet.getEntityId());
          if (pet.combatantProperties.isDead()) {
            return;
          }
          modelOption?.skeletalAnimationManager.startAnimationWithTransition(
            SkeletalAnimationName.OnSummoned,
            500,
            {
              onComplete: () => {
                modelOption.animationControls.startIdleAnimation(500);
              },
            }
          );
        },
      });
    }
  }

  private applyPetSlotsReleased(petSlotsSummoned?: PetSlot[]) {
    if (!petSlotsSummoned) return;

    for (const { ownerId, slotIndex } of petSlotsSummoned) {
      this.party.petManager.releasePetInSlot(ownerId, slotIndex);
    }
  }

  private applyHitPointChanges(command: ActivatedTriggersGameUpdateCommand) {
    if (!command.hitPointChanges) {
      return;
    }

    const hitPointChanges = HitPointChanges.fromSerialized(command.hitPointChanges);
    const action = COMBAT_ACTIONS[command.actionName];

    for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
      new CombatantResourceChangeUpdateHandlerCommand(
        this.clientApplication,
        command,
        hpChange,
        ActionPayableResource.HitPoints,
        entityId,
        false,
        action.hitOutcomeProperties.getShouldAnimateTargetHitRecovery()
      ).execute();
    }
  }

  private applyDurabilityChanges(durabilityChanges?: DurabilityChangesByEntityId) {
    if (!durabilityChanges) return;

    DurabilityChangesByEntityId.ApplyToGame(
      this.party,
      durabilityChanges,
      (combatant, equipment) => {
        const slot = combatant.combatantProperties.equipment.getSlotItemIsEquippedTo(
          equipment.entityProperties.id
        );

        const justBrokeHoldable = equipment.isBroken() && slot?.type === EquipmentSlotType.Holdable;
        if (!justBrokeHoldable) {
          return;
        }

        this.clientApplication.floatingMessagesService.startBrokenHoldablesMessage(
          combatant.entityProperties.id,
          equipment
        );

        const combatantSceneEntityManager =
          this.gameWorldView?.sceneEntityService.combatantSceneEntityManager;
        if (!combatantSceneEntityManager) return;

        const characterModelOption = combatantSceneEntityManager?.getOptional(
          combatant.entityProperties.id
        );

        // remove the model if it broke
        // if this causes bugs because it is jumping the queue, look into it
        // if we use the queue though, it will wait to break their model and not look like it broke instantly
        // maybe we can set visibilty instead and despawn it later
        characterModelOption?.equipmentManager.synchronizeCombatantEquipmentModels();
      }
    );
  }

  private applyConditions(
    appliedConditions?: Partial<
      Record<HitOutcome, Record<string, SerializedOf<CombatantCondition>[]>>
    >
  ) {
    if (!appliedConditions) return;

    for (const [_hitOutcome, entityAppliedConditions] of iterateNumericEnumKeyedRecord(
      appliedConditions
    )) {
      for (const [entityId, conditions] of Object.entries(entityAppliedConditions)) {
        const combatantResult = this.party.combatantManager.getExpectedCombatant(entityId);
        for (const condition of conditions) {
          const deserializedCondition = deserializeCondition(condition);
          deserializedCondition.makeObservable();

          combatantResult.combatantProperties.conditionManager.applyCondition(
            deserializedCondition
          );

          this.clientApplication.gameWorldView?.sceneEntityService.startOrStopCosmeticEffects(
            deserializedCondition.getCosmeticEffectWhileActive?.(
              combatantResult.entityProperties.id
            ),
            []
          );

          this.battleOption?.turnOrderManager.turnSchedulerManager.addConditionToTurnOrder(
            this.party,
            deserializedCondition
          );
        }
      }
    }
  }

  private applyActionEntityChanges(
    actionEntityChanges?: Record<string, Partial<ActionEntityActionOriginData>>
  ) {
    if (!actionEntityChanges) return;

    for (const [id, changes] of Object.entries(actionEntityChanges)) {
      const { actionLevel, stacks, userCombatantAttributes } = changes;

      const { actionEntityManager } = this.party;

      const actionEntity = actionEntityManager.getExpectedActionEntity(id);
      let { actionOriginData } = actionEntity.actionEntityProperties;
      if (!actionOriginData) {
        actionOriginData = actionEntity.actionEntityProperties.actionOriginData = {
          spawnedBy: { id: "", name: "not found" as EntityName },
        };
      }

      // @PERF - probably don't need to send the whole MaxAndCurrent for level and stacks unless
      // we one day want to change the max, but it is simpler this way since we get to use a Partial of
      // the action entity's action origin properties
      // @REFACTOR create a merging factory to combine the changes with existing

      if (actionLevel !== undefined) {
        ActionEntity.setLevel(actionEntity, actionLevel.current);
      }
      if (stacks !== undefined) {
        ActionEntity.setStacks(actionEntity, stacks.current);
      }
      if (userCombatantAttributes) {
        actionOriginData.userCombatantAttributes = userCombatantAttributes;
      }
    }
  }

  private applyDespawnedActionEntities(
    actionEntityIdsDespawned?: {
      id: string;
      cleanupMode: CleanupMode;
    }[]
  ) {
    if (!actionEntityIdsDespawned) return;

    const { actionEntityManager } = this.party;
    for (const { id, cleanupMode } of actionEntityIdsDespawned) {
      actionEntityManager.unregisterActionEntity(id);
      this.clientApplication.gameWorldView?.sceneEntityService.actionEntityManager.unregister(
        id,
        cleanupMode
      );
    }
  }

  private applyActionEntitiesHidden(actionEntityIdsToHide?: string[]) {
    if (!actionEntityIdsToHide) return;
    const gameWorldView = this.clientApplication.gameWorldView;
    if (!gameWorldView) return;

    for (const id of actionEntityIdsToHide) {
      const actionEntity = gameWorldView.sceneEntityService.actionEntityManager.requireById(id);
      actionEntity?.setVisibility(0);

      // @REFACTOR - this looks like duct tape
      if (actionEntity.name === ActionEntityName.IceBolt) {
        actionEntity.cosmeticEffectManager.softCleanup(() => {
          //
        });
      }
    }
  }
}
