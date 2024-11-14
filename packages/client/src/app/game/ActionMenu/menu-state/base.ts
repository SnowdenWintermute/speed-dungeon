import { inventoryItemsMenuState, useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ActionUsableContext,
  Battle,
  ClientToServerEvent,
  CombatActionType,
  CombatantAbility,
  CombatantAbilityName,
  CombatantProperties,
  formatAbilityName,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";

export class BaseMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.Base;
  constructor(public inCombat: boolean) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const setInventoryOpen = new ActionMenuButtonProperties("Open Inventory", () => {
      useGameStore.getState().mutateState((state) => {
        state.menuState = inventoryItemsMenuState;
      });
    });
    setInventoryOpen.dedicatedKeys = ["KeyI", "KeyS"];
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    if (!this.inCombat) {
      const toggleReadyToExplore = new ActionMenuButtonProperties("Ready to explore", () => {
        websocketConnection.emit(ClientToServerEvent.ToggleReadyToExplore);
      });
      toReturn[ActionButtonCategory.Numbered].push(toggleReadyToExplore);
    }

    let focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }
    const { combatantProperties, entityProperties } = focusedCharacterResult;
    const characterId = entityProperties.id;

    // disabled abilities if not their turn in a battle
    const gameOption = useGameStore.getState().game;
    const username = useGameStore.getState().username;
    const gameAndPartyResult = getGameAndParty(gameOption, username);
    if (gameAndPartyResult instanceof Error) {
      console.trace(gameAndPartyResult);
      return toReturn;
    }
    const [game, party] = gameAndPartyResult;

    const battleOptionResult = getCurrentBattleOption(game, party.name);
    let disabledBecauseNotThisCombatantTurn = false;
    if (battleOptionResult && !(battleOptionResult instanceof Error)) {
      disabledBecauseNotThisCombatantTurn = !Battle.combatantIsFirstInTurnOrder(
        battleOptionResult,
        characterId
      );
    }

    const abilitiesNotToMakeButtonsFor = [
      CombatantAbilityName.AttackMeleeOffhand,
      CombatantAbilityName.AttackMeleeMainhand,
      CombatantAbilityName.AttackRangedMainhand,
    ];

    for (const ability of Object.values(combatantProperties.abilities)) {
      if (abilitiesNotToMakeButtonsFor.includes(ability.name)) continue;
      const button = new ActionMenuButtonProperties(formatAbilityName(ability.name), () => {
        websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
          characterId,
          combatActionOption: { type: CombatActionType.AbilityUsed, abilityName: ability.name },
        });
      });

      const abilityAttributes = CombatantAbility.getAttributes(ability.name);
      const { usabilityContext } = abilityAttributes.combatActionProperties;

      const abilityCostIfOwned = CombatantProperties.getAbilityCostIfOwned(
        combatantProperties,
        ability.name
      );
      const notEnoughMana =
        abilityCostIfOwned instanceof Error || combatantProperties.mana < abilityCostIfOwned;

      button.shouldBeDisabled =
        (usabilityContext === ActionUsableContext.InCombat && !this.inCombat) ||
        (usabilityContext === ActionUsableContext.OutOfCombat && this.inCombat) ||
        notEnoughMana ||
        disabledBecauseNotThisCombatantTurn;

      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return toReturn;
  }
}
