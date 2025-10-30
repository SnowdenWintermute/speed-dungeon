import {
  Battle,
  BattleConclusion,
  BattleResultActionCommandPayload,
  CleanupMode,
  Consumable,
  Equipment,
} from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { gameWorld, getGameWorld } from "../3d-world/SceneManager";
import { ImageManagerRequestType } from "../3d-world/game-world/image-manager";
import { plainToInstance } from "class-transformer";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "../game/ActionMenu/menu-state/menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";

export async function battleResultActionCommandHandler(
  this: ClientActionCommandReceiver,
  _gameName: string,
  payload: BattleResultActionCommandPayload
) {
  const { timestamp, actionEntitiesRemoved } = payload;

  if (payload.loot) {
    payload.loot.equipment = payload.loot.equipment.map((item) => plainToInstance(Equipment, item));
    payload.loot.consumables = payload.loot.consumables.map((item) =>
      plainToInstance(Consumable, item)
    );

    for (const item of payload.loot.equipment) {
      gameWorld.current?.imageManager.enqueueMessage({
        type: ImageManagerRequestType.ItemCreation,
        item,
      });
    }

    const { actionMenuStore } = AppStore.get();
    if (actionMenuStore.currentMenuIsType(MenuStateType.Base)) {
      actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.ItemsOnGround));
    }
  }

  const { game, party } = AppStore.get().gameStore.getFocusedCharacterContext();

  switch (payload.conclusion) {
    case BattleConclusion.Defeat:
      party.timeOfWipe = timestamp;
      GameLogMessageService.postWipeMessage();
      break;
    case BattleConclusion.Victory:
      characterAutoFocusManager.focusFirstOwnedCharacter();

      party.inputLock.unlockInput();

      const levelups = Battle.handleVictory(game, party, payload);

      for (const [characterId, expChange] of Object.entries(payload.experiencePointChanges)) {
        const characterResult = game.getCombatantById(characterId);
        if (characterResult instanceof Error) return console.error(characterResult);
        GameLogMessageService.postExperienceGained(characterResult.getName(), expChange);
      }
      for (const [characterId, levelup] of Object.entries(levelups)) {
        const characterResult = game.getCombatantById(characterId);
        if (characterResult instanceof Error) return console.error(characterResult);
        GameLogMessageService.postLevelup(characterResult.getName(), levelup);
      }
      break;
  }

  const { actionEntityManager } = party;
  for (const entityId of actionEntitiesRemoved) {
    actionEntityManager.unregisterActionEntity(entityId);
    getGameWorld().actionEntityManager.unregister(entityId, CleanupMode.Soft);
  }
}
