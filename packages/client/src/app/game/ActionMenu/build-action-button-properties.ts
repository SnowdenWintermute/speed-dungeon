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
import createActionButtonClickHandler from "./click-handlers";
import determineActionButtonText from "./determine-action-menu-button-text";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import getButtonDedicatedKeyAndCategory from "./get-button-dedicated-keys-and-category";
import {
  createActionButtonMouseEnterHandler,
  createActionButtonMouseLeaveHandler,
} from "./hover-handlers";
import { GameAction } from "./game-actions";

export default function buildActionButtonProperties(
  gameState: GameState,
  uiState: UIState,
  mutateAlertState: MutateState<AlertState>,
  socketOption: undefined | Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  action: GameAction
): Error | ActionMenuButtonProperties {
  if (!socketOption) return new Error(ERROR_MESSAGES.CLIENT.NO_SOCKET_OBJECT);
  const socket = socketOption;
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

  const mouseEnterHandler = createActionButtonMouseEnterHandler(
    gameState,
    mutateAlertState,
    action
  );
  const mouseLeaveHandler = createActionButtonMouseLeaveHandler(gameState, action);

  const { dedicatedKeysOption, category } = getButtonDedicatedKeyAndCategory(action);

  return {
    text,
    clickHandler,
    focusHandler: mouseEnterHandler,
    blurHandler: mouseLeaveHandler,
    mouseEnterHandler,
    mouseLeaveHandler,
    shouldBeDisabled: false,
    dedicatedKeysOption,
    category,
    action,
  };
}
