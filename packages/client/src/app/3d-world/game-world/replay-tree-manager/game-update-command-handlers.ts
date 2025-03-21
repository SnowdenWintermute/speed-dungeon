import {
  ActivatedTriggersGameUpdateCommand,
  DurabilityChangesByEntityId,
  DynamicAnimationName,
  ERROR_MESSAGES,
  EntityMotionGameUpdateCommand,
  Equipment,
  GameUpdateCommandType,
  HitOutcomesGameUpdateCommand,
  HitPointChanges,
  MOBILE_VFX_NAME_STRINGS,
  MobileVfxName,
  ResourcesPaidGameUpdateCommand,
  SpawnEntityGameUpdateCommand,
  SpawnableEntityType,
  SpeedDungeonGame,
  VfxParentType,
  VfxType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { MobileVfxModel, spawnMobileVfxModel } from "../../vfx-models";
import { getChildMeshByName } from "../../utils";
import {
  SKELETON_MAIN_HAND_NAMES,
  SKELETON_STRUCTURE_TYPE,
} from "../../combatant-models/modular-character/skeleton-structure-variables";
import { Vector3 } from "@babylonjs/core";
import { entityMotionGameUpdateHandler } from "./entity-motion";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes";
import { useGameStore } from "@/stores/game-store";
import { plainToInstance } from "class-transformer";
import { induceHitRecovery } from "../../combatant-models/animation-manager/induce-hit-recovery";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Promise<Error | void>
> = {
  [GameUpdateCommandType.EntityMotion]: async function (update: {
    command: EntityMotionGameUpdateCommand;
    isComplete: boolean;
  }) {
    entityMotionGameUpdateHandler(update);
  },
  [GameUpdateCommandType.ResourcesPaid]: async function (update: {
    command: ResourcesPaidGameUpdateCommand;
    isComplete: boolean;
  }) {
    update.isComplete = true;
    // deduct the resources
    // enqueue the floating text messages
    //
    // completes instantly
    // throw new Error("Function not implemented.");
  },
  [GameUpdateCommandType.ActivatedTriggers]: async function (update: {
    command: ActivatedTriggersGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    useGameStore.getState().mutateState((gameState) => {
      const game = gameState.game;
      if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      if (command.durabilityChanges) {
        gameState.rerenderForcer += 1; // for some reason it delays updating the durability indicators on bow use without this
        // playBeep();
        DurabilityChangesByEntityId.ApplyToGame(
          game,
          command.durabilityChanges,
          (combatant, equipment) => {
            // remove the model if it broke
            // @TODO - if this causes bugs because it is jumping the queue, look into it
            // if we use the queue though, it doesn't remove their item model imediately
            if (Equipment.isBroken(equipment)) {
              gameWorld.current?.modelManager.combatantModels[
                combatant.entityProperties.id
              ]?.unequipHoldableModel(equipment.entityProperties.id);
            }
          }
        );
      }

      if (command.appliedConditions) {
        for (const [hitOutcome, entityAppliedConditions] of iterateNumericEnumKeyedRecord(
          command.appliedConditions
        )) {
          for (const [entityId, conditions] of Object.entries(entityAppliedConditions)) {
            useGameStore.getState().mutateState((state) => {
              const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
              if (combatantResult instanceof Error) return combatantResult;
              combatantResult.combatantProperties.conditions.push(...conditions);
            });
          }
        }
      }

      if (command.removedConditionIds) {
        for (const [entityId, conditionIds] of Object.entries(command.removedConditionIds)) {
          for (const conditionId of conditionIds) {
            useGameStore.getState().mutateState((state) => {
              const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
              if (combatantResult instanceof Error) return combatantResult;
              combatantResult.combatantProperties.conditions =
                combatantResult.combatantProperties.conditions.filter(
                  (condition) => condition.id !== conditionId
                );
            });
          }
        }
      }
    });

    if (command.hitPointChanges) {
      const hitPointChanges = plainToInstance(HitPointChanges, command.hitPointChanges);

      if (!gameWorld.current) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
      if (hitPointChanges) {
        for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
          const wasSpell = false;
          induceHitRecovery(gameWorld.current, entityId, entityId, hpChange, wasSpell, false);
        }
      }
    }

    update.isComplete = true;
    // or show floating text for counterspell, "triggered tech burst" "psionic explosion"
  },
  [GameUpdateCommandType.HitOutcomes]: async function (update: {
    command: HitOutcomesGameUpdateCommand;
    isComplete: boolean;
  }) {
    update.isComplete = true;
    hitOutcomesGameUpdateHandler(update);
  },
  [GameUpdateCommandType.SpawnEntity]: async function (update: {
    command: SpawnEntityGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    if (command.entity.type !== SpawnableEntityType.Vfx) {
      update.isComplete = true;
      return;
    }
    if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    const { vfx } = command.entity;
    const { vfxProperties } = vfx;

    if (vfxProperties.vfxType !== VfxType.Mobile) {
      return new Error("non-mobile vfx not implemented");
    }

    const position = new Vector3(
      vfxProperties.position._x,
      vfxProperties.position._y,
      vfxProperties.position._z
    );

    const scene = await spawnMobileVfxModel(vfxProperties.name, position);

    const vfxModel = new MobileVfxModel(
      vfx.entityProperties.id,
      scene,
      position,
      vfxProperties.name
    );

    if (vfxProperties.name === MobileVfxName.Explosion)
      vfxModel.animationManager.startAnimationWithTransition(
        DynamicAnimationName.ExplosionDelivery,
        0,
        {
          shouldLoop: false,
          animationEventOption: null,
          animationDurationOverrideOption: null,
          onComplete: () => {
            update.isComplete = true;
          },
        }
      );
    else update.isComplete = true;

    gameWorld.current.vfxManager.register(vfxModel);

    if (vfxProperties.parentOption) {
      if (vfxProperties.parentOption.type === VfxParentType.UserMainHand) {
        const actionUserOption =
          gameWorld.current.modelManager.combatantModels[vfxProperties.parentOption.parentEntityId];
        if (!actionUserOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
        const userMainHandBone = getChildMeshByName(
          actionUserOption.rootMesh,
          SKELETON_MAIN_HAND_NAMES[SKELETON_STRUCTURE_TYPE]
        );
        if (!userMainHandBone) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_EXPECTED_BONE);
        vfxModel.movementManager.transformNode.setParent(userMainHandBone);
        vfxModel.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
      }
    }
  },
  [GameUpdateCommandType.EndTurn]: function (arg: any): Promise<void | Error> {
    throw new Error("Function not implemented.");
  },
};
