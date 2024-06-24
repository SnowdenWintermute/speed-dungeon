import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { UIState } from "@/stores/ui-store";
import {
  ERROR_MESSAGES,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import collectActionMenuRelevantInformation from "./collect-action-menu-relevant-information";
import createGameActions from "./create-game-actions";
import createActionButtonClickHandler from "./click-handlers";
import determineActionButtonText from "./determine-action-menu-button-text";
import { ActionButtonCategory, ActionMenuButtonProperties } from "./action-menu-button-properties";
import getParty from "@/utils/getParty";
import getButtonDedicatedKeyAndCategory from "./get-button-dedicated-keys-and-category";
import {
  createActionButtonMouseEnterHandler,
  createActionButtonMouseLeaveHandler,
} from "./hover-handlers";

export type ActionButtonPropertiesByCategory = Record<
  ActionButtonCategory,
  ActionMenuButtonProperties[]
>;

export default function buildActionButtonProperties(
  gameState: GameState,
  uiState: UIState,
  mutateAlertState: MutateState<AlertState>,
  socketOption: undefined | Socket<ServerToClientEventTypes, ClientToServerEventTypes>
): Error | ActionButtonPropertiesByCategory {
  const buttonPropertiesByCategory: ActionButtonPropertiesByCategory = {
    [ActionButtonCategory.Top]: [],
    [ActionButtonCategory.Numbered]: [],
    [ActionButtonCategory.NextPrevious]: [],
  };

  if (!socketOption) return new Error(ERROR_MESSAGES.CLIENT.NO_SOCKET_OBJECT);
  const socket = socketOption;
  const partyResult = getParty(gameState.game, gameState.username);
  if (partyResult instanceof Error) return partyResult;
  const relevantInformationResult = collectActionMenuRelevantInformation(gameState, partyResult);
  if (relevantInformationResult instanceof Error) return buttonPropertiesByCategory;
  const gameActions = createGameActions(relevantInformationResult);

  for (const action of gameActions) {
    const textResult = determineActionButtonText(gameState, action);
    if (textResult instanceof Error) return textResult;
    const text = textResult;
    const clickHandler = createActionButtonClickHandler(
      action,
      gameState,
      uiState,
      mutateAlertState,
      socket
    );

    const mouseEnterHandler = createActionButtonMouseEnterHandler(gameState, action);
    const mouseLeaveHandler = createActionButtonMouseLeaveHandler(gameState, action);

    const { dedicatedKeysOption, category } = getButtonDedicatedKeyAndCategory(action);

    const buttonProperties = {
      text,
      clickHandler,
      focusHandler: mouseEnterHandler,
      blurHandler: mouseLeaveHandler,
      mouseEnterHandler,
      mouseLeaveHandler,
      shouldBeDisabled: false,
      dedicatedKeysOption,
      category,
    };

    switch (category) {
      case ActionButtonCategory.Top:
        buttonPropertiesByCategory[ActionButtonCategory.Top].push(buttonProperties);
        break;
      case ActionButtonCategory.Numbered:
        buttonPropertiesByCategory[ActionButtonCategory.Numbered].push(buttonProperties);
        break;
      case ActionButtonCategory.NextPrevious:
        buttonPropertiesByCategory[ActionButtonCategory.NextPrevious].push(buttonProperties);
        break;
    }
  }

  return buttonPropertiesByCategory;
}
