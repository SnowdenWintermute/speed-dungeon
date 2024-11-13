import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { UIState } from "@/stores/ui-store";
import createActionButtonClickHandler from "./click-handlers";
import determineActionButtonText from "./determine-action-menu-button-text";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import getButtonDedicatedKeyAndCategory from "./get-button-dedicated-keys-and-category";
import {
  createActionButtonMouseEnterHandler,
  createActionButtonMouseLeaveHandler,
} from "./hover-handlers";
import { GameAction } from "./game-actions";
import actionButtonShouldBeDisabled from "./button-should-be-disabled";

export default function buildActionButtonProperties(
  gameState: GameState,
  uiState: UIState,
  mutateAlertState: MutateState<AlertState>,
  action: GameAction
): Error | ActionMenuButtonProperties {
  const textResult = determineActionButtonText(gameState, action);
  if (textResult instanceof Error) return textResult;
  const text = textResult;

  const clickHandler = createActionButtonClickHandler(action);

  const mouseEnterHandler = createActionButtonMouseEnterHandler(
    gameState,
    mutateAlertState,
    action
  );
  const mouseLeaveHandler = createActionButtonMouseLeaveHandler(gameState, action);

  const { dedicatedKeysOption, category } = getButtonDedicatedKeyAndCategory(action);

  const shouldBeDisabledResult = actionButtonShouldBeDisabled(gameState, uiState, action);
  if (shouldBeDisabledResult instanceof Error) return shouldBeDisabledResult;
  const shouldBeDisabled = shouldBeDisabledResult;

  return {
    text,
    clickHandler,
    focusHandler: mouseEnterHandler,
    blurHandler: mouseLeaveHandler,
    mouseEnterHandler,
    mouseLeaveHandler,
    shouldBeDisabled: shouldBeDisabled,
    dedicatedKeysOption,
    category,
    action,
  };
}
