import {
  applyExperiencePointChanges,
  BattleConclusion,
  BattleConclusionUpdateCommand,
  CleanupMode,
  Consumable,
  Equipment,
} from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import { ReplayStepExecution } from "../replay-step-execution";
import { ImageGenerationRequestType } from "@/game-world-view/images/image-generator-requests";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";

export async function battleConclusionGameUpdateHandler(
  clientApplication: ClientApplication,
  update: ReplayStepExecution<BattleConclusionUpdateCommand>
) {
  const { command } = update;
  const { gameWorldView, actionMenu, eventLogMessageService, combatantFocus } = clientApplication;
  const { game, party } = combatantFocus.requireFocusedCharacterContext();

  if (command.removedConditionIds) {
    for (const [combatantId, conditionIds] of Object.entries(command.removedConditionIds)) {
      const combatantResult = game.getCombatantById(combatantId);
      if (combatantResult instanceof Error) {
        console.error(combatantResult);
        continue;
      }
      for (const conditionId of conditionIds) {
        combatantResult.combatantProperties.conditionManager.removeConditionById(conditionId);
      }
    }
  }

  if (command.removedCombatantIds) {
    for (const id of command.removedCombatantIds) {
      party.combatantManager.removeCombatant(id, game);
    }
  }

  if (command.loot) {
    const equipment = command.loot.equipment.map((item) => Equipment.fromSerialized(item));
    const consumables = command.loot.consumables.map((item) => Consumable.fromSerialized(item));
    party.currentRoom.inventory.insertItems([...consumables, ...equipment]);

    for (const item of equipment) {
      gameWorldView?.imageGenerator.enqueueMessage({
        type: ImageGenerationRequestType.ItemCreation,
        data: { item },
      });
    }

    if (actionMenu.currentMenuIsType(ActionMenuScreenType.Root)) {
      actionMenu.pushFromPool(ActionMenuScreenType.ItemsOnGround);
    }
  }

  if (command.experiencePointChanges) {
    applyExperiencePointChanges(party, command.experiencePointChanges);
    for (const [characterId, expChange] of Object.entries(command.experiencePointChanges)) {
      const characterResult = game.getCombatantById(characterId);
      if (characterResult instanceof Error) {
        console.error(characterResult);
        continue;
      }
      eventLogMessageService.postExperienceGained(characterResult.getName(), expChange);
      const newLevelOption =
        characterResult.combatantProperties.classProgressionProperties.awardLevelups();
      if (newLevelOption !== null) {
        eventLogMessageService.postLevelup(characterResult.getName(), newLevelOption);
      }
    }
  }

  switch (command.conclusion) {
    case BattleConclusion.Defeat:
      party.timeOfWipe = command.timestamp;
      eventLogMessageService.postWipeMessage();
      break;
    case BattleConclusion.Victory:
      combatantFocus.focusFirstOwnedCharacter();
      party.inputLock.unlockInput();
      break;
  }

  if (command.actionEntitiesRemoved) {
    const { actionEntityManager } = party;
    for (const entityId of command.actionEntitiesRemoved) {
      actionEntityManager.unregisterActionEntity(entityId);
      gameWorldView?.sceneEntityService.actionEntityManager.unregister(entityId, CleanupMode.Soft);
    }
  }

  if (party.battleId !== null) {
    game.battles.delete(party.battleId);
    party.setBattleId(null);
  }
}
