import {
  CRAFTING_ACTION_DESCRIPTIONS,
  CRAFTING_ACTION_DISABLED_CONDITIONS,
  CRAFTING_ACTION_STRINGS,
  ClientIntentType,
  CraftingAction,
  Equipment,
  INFO_UNICODE_SYMBOL,
  getCraftingActionPrice,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";
import { ActionMenuNumberedButton } from "./ActionMenuNumberedButton";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { IconName, SVG_ICONS } from "@/app/icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";

interface Props {
  equipment: Equipment;
  craftingAction: CraftingAction;
  listIndex: number;
}

export const CraftActionButton = observer((props: Props) => {
  const { equipment, craftingAction, listIndex } = props;
  const clientApplication = useClientApplication();
  const { gameClientRef, gameContext, actionMenu, combatantFocus } = clientApplication;

  const focusedCharacterResult = combatantFocus.requireFocusedCharacter();
  const party = gameContext.requireParty();

  const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();

  const actionPrice = getCraftingActionPrice(craftingAction, equipment);
  const { inventory } = focusedCharacterResult.combatantProperties;
  const canNotAfford = !inventory.canAffordShardPrice(actionPrice);
  const actionDisabledOnItem = CRAFTING_ACTION_DISABLED_CONDITIONS[craftingAction](
    equipment,
    party.dungeonExplorationManager.getCurrentFloor()
  );
  const isWaitingForPendingCraftResult = actionMenu.characterIsCrafting(
    focusedCharacterResult.getEntityId()
  );

  const shouldBeDisabled =
    !userControlsThisCharacter ||
    canNotAfford ||
    actionDisabledOnItem ||
    isWaitingForPendingCraftResult;

  const buttonNumber = listIndex + 1;

  const titleDisabledStyles = shouldBeDisabled ? "opacity-50" : "";
  const shardPriceDisabledStyles = canNotAfford ? UNMET_REQUIREMENT_TEXT_COLOR : "";

  return (
    <ActionMenuNumberedButton
      disabled={shouldBeDisabled}
      hotkeys={[`Digit${buttonNumber}`]}
      hotkeyLabel={buttonNumber.toString()}
      clickHandler={() => {
        actionMenu.setCharacterIsCrafting(focusedCharacterResult.getEntityId());
        gameClientRef.get().dispatchIntent({
          type: ClientIntentType.PerformCraftingAction,
          data: {
            characterId: focusedCharacterResult.getEntityId(),
            itemId: equipment.getEntityId(),
            craftingAction,
          },
        });
      }}
    >
      <div className="flex justify-between w-full px-2 relative">
        <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
          <HoverableTooltipWrapper
            extraStyles="inline mr-2"
            tooltipText={CRAFTING_ACTION_DESCRIPTIONS[craftingAction]}
          >
            {INFO_UNICODE_SYMBOL}
          </HoverableTooltipWrapper>
          <span className={titleDisabledStyles}>{CRAFTING_ACTION_STRINGS[craftingAction]}</span>
        </div>
        <div className="w-fit flex h-full items-center">
          <span className={`mr-1 ${shardPriceDisabledStyles}`}>{actionPrice}</span>
          {SVG_ICONS[IconName.Shards]("h-[20px] fill-slate-400")}
        </div>
      </div>
    </ActionMenuNumberedButton>
  );
});
