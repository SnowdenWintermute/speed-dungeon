import {
  BattleConclusion,
  BattleResultActionCommandPayload,
  Consumable,
  ERROR_MESSAGES,
  Equipment,
  InputLock,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import getCurrentParty from "@/utils/getCurrentParty";
import { CombatLogMessage, CombatLogMessageStyle } from "../game/combat-log/combat-log-message";
import { itemsOnGroundMenuState, useGameStore } from "@/stores/game-store";
import { gameWorld } from "../3d-world/SceneManager";
import { ImageManagerRequestType } from "../3d-world/game-world/image-manager";
import { MenuStateType } from "../game/ActionMenu/menu-state";
import { plainToInstance } from "class-transformer";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";

export async function battleResultActionCommandHandler(
  this: ClientActionCommandReceiver,
  _gameName: string,
  payload: BattleResultActionCommandPayload
) {
  const { timestamp } = payload;

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

    const currentMenu = useGameStore.getState().getCurrentMenu();
    if (currentMenu.type === MenuStateType.Base)
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.push(itemsOnGroundMenuState);
      });
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
        characterAutoFocusManager.focusFirstOwnedCharacter(state);

        InputLock.unlockInput(partyOption.inputLock);

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
}
