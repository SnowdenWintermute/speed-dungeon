import {
  BattleConclusion,
  BattleResultActionCommandPayload,
  ERROR_MESSAGES,
  ItemPropertiesType,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import getCurrentParty from "@/utils/getCurrentParty";
import { ActionCommandManager } from "@speed-dungeon/common";
import { CombatLogMessage, CombatLogMessageStyle } from "../game/combat-log/combat-log-message";
import { useGameStore } from "@/stores/game-store";
import { gameWorld } from "../3d-world/SceneManager";
import { ImageManagerRequestType } from "../3d-world/game-world/image-manager";

export default function battleResultActionCommandHandler(
  this: ClientActionCommandReceiver,
  actionCommandManager: ActionCommandManager,
  _gameName: string,
  _combatantId: string,
  payload: BattleResultActionCommandPayload
) {
  const { timestamp } = payload;

  if (payload.loot) {
    for (const item of payload.loot) {
      console.log("enqueueing screenshot creation for ", item.entityProperties.name);
      if (item.itemProperties.type === ItemPropertiesType.Consumable) continue;

      gameWorld.current?.imageManager.enqueueMessage({
        type: ImageManagerRequestType.ItemCreation,
        item,
      });
    }
  }

  useGameStore.getState().mutateState((state) => {
    const gameOption = state.game;
    if (gameOption === null) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    if (state.username === null) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const partyOption = getCurrentParty(state, state.username);
    if (partyOption === undefined) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    switch (payload.conclusion) {
      case BattleConclusion.Defeat:
        partyOption.timeOfWipe = timestamp;
        state.combatLogMessages.push(
          new CombatLogMessage("Your party was defeated", CombatLogMessageStyle.PartyWipe)
        );
        break;
      case BattleConclusion.Victory:
        const levelups = SpeedDungeonGame.handleBattleVictory(gameOption, partyOption, payload);

        for (const [characterId, expChange] of Object.entries(payload.experiencePointChanges)) {
          const characterResult = SpeedDungeonGame.getCombatantById(gameOption, characterId);
          if (characterResult instanceof Error) return console.error(characterResult);
          state.combatLogMessages.push(
            new CombatLogMessage(
              `${characterResult.entityProperties.name} gained ${expChange} experience points`,
              CombatLogMessageStyle.PartyProgress
            )
          );
        }
        for (const [characterId, levelup] of Object.entries(levelups)) {
          const characterResult = SpeedDungeonGame.getCombatantById(gameOption, characterId);
          if (characterResult instanceof Error) return console.error(characterResult);
          state.combatLogMessages.push(
            new CombatLogMessage(
              `${characterResult.entityProperties.name} reached level ${levelup}!`,
              CombatLogMessageStyle.PartyProgress
            )
          );
        }
        break;
    }

    state.baseMenuState.inCombat = false;
  });
  actionCommandManager.processNextCommand();
}
