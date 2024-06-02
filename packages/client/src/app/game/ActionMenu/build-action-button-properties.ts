import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { UIState } from "@/stores/ui-store";
import {
  AdventuringParty,
  InPartyClientToServerEventTypes,
  InPartyServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import collectActionMenuRelevantInformation from "./collect-action-menu-relevant-information";
import createGameActions from "./create-game-actions";
import createActionButtonClickHandler from "./click-handlers";
import determineActionButtonText from "./determine-action-menu-button-text";
import {
  ActionButtonCategories,
  ActionMenuButtonProperties,
} from "./action-menu-button-properties";
import getParty from "@/utils/getParty";

export interface ActionButtonsByCategory {
  top: ActionMenuButtonProperties[];
  numbered: ActionMenuButtonProperties[];
  nextPrev: ActionMenuButtonProperties[];
}

export default function buildActionButtonProperties(
  gameState: GameState,
  uiState: UIState,
  mutateAlertState: MutateState<AlertState>,
  partySocket: Socket<InPartyServerToClientEventTypes, InPartyClientToServerEventTypes>
): Error | ActionButtonsByCategory {
  const partyResult = getParty(gameState.game, gameState.username);
  if (partyResult instanceof Error) return partyResult;
  const relevantInformationResult = collectActionMenuRelevantInformation(gameState, partyResult);
  if (relevantInformationResult instanceof Error) return relevantInformationResult;
  const gameActions = createGameActions(relevantInformationResult);
  const buttonPropertiesByCategory: ActionButtonsByCategory = {
    top: [],
    numbered: [],
    nextPrev: [],
  };

  for (const action of gameActions) {
    const textResult = determineActionButtonText(gameState, action);
    if (textResult instanceof Error) return textResult;
    const text = textResult;
    const clickHandler = createActionButtonClickHandler(
      action,
      gameState,
      uiState,
      mutateAlertState,
      partySocket
    );

    buttonPropertiesByCategory.numbered.push({
      text,
      clickHandler,
      focusHandler: () => {},
      blurHandler: () => {},
      mouseEnterHandler: () => {},
      mouseLeaveHandler: () => {},
      shouldBeDisabled: false,
      dedicatedKeysOption: null,
      category: ActionButtonCategories.Numbered,
    });
  }

  return buttonPropertiesByCategory;
}
