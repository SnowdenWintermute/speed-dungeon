import { getCurrentMenu, useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  CONSUMABLE_TURQUOISE,
  CONSUMABLE_TYPE_STRINGS,
  CombatantProperties,
  Consumable,
  ConsumableType,
  Equipment,
  Item,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { setAlert } from "@/app/components/alerts";
import { immerable } from "immer";
import setItemHovered from "@/utils/set-item-hovered";
import createPageButtons from "./create-page-buttons";
import { Color4 } from "@babylonjs/core";
import cloneDeep from "lodash.clonedeep";
import { createEaseGradient } from "@/utils/create-ease-gradient-style";
import { ReactNode, useState } from "react";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";

const hexRed = "#563D45"; // eye droppered from paper doll slot disabled with filter
const GREEN = Color4.FromHexString(CONSUMABLE_TURQUOISE).scale(255);
const RED = Color4.FromHexString(hexRed).scale(255);
const GRAY = new Color4(0.55, 0.55, 0.55, 1.0).scale(255);
const TRANSPARENT = cloneDeep(GRAY);
TRANSPARENT.a = 0;
const gradientBg = createEaseGradient(TRANSPARENT, GRAY, 1, 25);
export const consumableGradientBg = createEaseGradient(TRANSPARENT, GREEN, 1, 25);
export const unmetRequirementsGradientBg = createEaseGradient(TRANSPARENT, RED, 1, 25);

export abstract class ItemsMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  constructor(
    public type:
      | MenuStateType.InventoryItems
      | MenuStateType.ViewingEquipedItems
      | MenuStateType.ItemsOnGround
      | MenuStateType.CraftingItemSelection
      | MenuStateType.PurchasingItems,
    private closeMenuTextAndHotkeys: { text: string; hotkeys: string[] },
    private itemButtonClickHandler: (item: Item) => void,
    private getItemsToShow: () => Item[],
    public extraButtons?: Partial<Record<ActionButtonCategory, ActionMenuButtonProperties[]>>
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const closeInventory = new ActionMenuButtonProperties(
      this.closeMenuTextAndHotkeys.text,
      this.closeMenuTextAndHotkeys.text,
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.pop();
          state.hoveredEntity = null;
          state.consideredItemUnmetRequirements = null;
          state.viewingDropShardsModal = false;
        });
      }
    );
    closeInventory.dedicatedKeys = [...this.closeMenuTextAndHotkeys.hotkeys, "Escape"];
    toReturn[ActionButtonCategory.Top].push(closeInventory);

    let focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult);
      return toReturn;
    }

    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return toReturn;
    }

    const equipmentAndShardStacks: Item[] = [];
    const consumablesByType: Partial<Record<ConsumableType, Consumable[]>> = {};

    const buttonTextPrefix = this.type === MenuStateType.ItemsOnGround ? "" : "";

    const itemsToShow = this.getItemsToShow();

    for (const item of itemsToShow) {
      if (
        item instanceof Equipment ||
        (item instanceof Consumable && item.consumableType === ConsumableType.StackOfShards)
      ) {
        equipmentAndShardStacks.push(item);
      } else if (item instanceof Consumable) {
        const { consumableType } = item;
        if (!consumablesByType[consumableType]) consumablesByType[consumableType] = [item];
        else consumablesByType[consumableType]!.push(item);
      }
    }

    for (const [consumableType, consumables] of iterateNumericEnumKeyedRecord(consumablesByType)) {
      const firstConsumableOfThisType = consumables[0];
      if (!firstConsumableOfThisType) continue;
      let consumableName = buttonTextPrefix + CONSUMABLE_TYPE_STRINGS[consumableType];
      if (consumables.length > 1) consumableName += ` (${consumables.length})`;

      const thumbnailId = CONSUMABLE_TYPE_STRINGS[consumableType];
      const thumbnailOption = useGameStore.getState().itemThumbnails[thumbnailId];
      const button = new ActionMenuButtonProperties(
        (
          <ItemButtonBody
            thumbnailOption={thumbnailOption}
            gradientOverride={consumableGradientBg}
            containerExtraStyles="text-teal-400"
            imageExtraStyles="scale-[300%]"
            imageHoverStyles="-translate-x-[55px]"
          >
            {consumableName}
          </ItemButtonBody>
        ),
        consumableName,
        () => {
          this.itemButtonClickHandler(firstConsumableOfThisType);
        }
      );
      button.mouseEnterHandler = () => itemButtonMouseEnterHandler(firstConsumableOfThisType);
      button.mouseLeaveHandler = () => itemButtonMouseLeaveHandler();
      button.focusHandler = () => itemButtonMouseEnterHandler(firstConsumableOfThisType);
      button.blurHandler = () => itemButtonMouseLeaveHandler();
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    for (const item of equipmentAndShardStacks) {
      const thumbnailOption = useGameStore.getState().itemThumbnails[item.entityProperties.id];
      const buttonText = buttonTextPrefix + item.entityProperties.name;
      let imageExtraStyles =
        item instanceof Equipment && Equipment.isWeapon(item)
          ? "scale-[300%]"
          : "scale-[200%] -translate-x-1/2 p-[2px]";

      const requirementsMet = Item.requirementsMet(
        item,
        CombatantProperties.getTotalAttributes(focusedCharacterResult.combatantProperties)
      );

      let containerExtraStyles = "";
      if (!requirementsMet) {
        containerExtraStyles += ` ${UNMET_REQUIREMENT_TEXT_COLOR}`;
        imageExtraStyles += " filter-red";
      } else if (item instanceof Equipment && Equipment.isMagical(item)) {
        containerExtraStyles += " text-blue-300";
      }
      const button = new ActionMenuButtonProperties(
        (
          <ItemButtonBody
            containerExtraStyles={containerExtraStyles}
            imageExtraStyles={imageExtraStyles}
            gradientOverride={!requirementsMet ? unmetRequirementsGradientBg : ""}
            thumbnailOption={thumbnailOption}
            imageHoverStyles="-translate-x-[55px]"
          >
            {buttonText}
          </ItemButtonBody>
        ),
        buttonText,
        () => {
          this.itemButtonClickHandler(item);
        }
      );

      button.mouseEnterHandler = () => itemButtonMouseEnterHandler(item);
      button.mouseLeaveHandler = () => itemButtonMouseLeaveHandler();
      button.focusHandler = () => itemButtonMouseEnterHandler(item);
      button.blurHandler = () => itemButtonMouseLeaveHandler();
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    createPageButtons(this, toReturn);

    if (!this.extraButtons) return toReturn;

    for (const [category, buttons] of iterateNumericEnumKeyedRecord(this.extraButtons)) {
      for (const button of buttons) toReturn[category].push(button);
    }

    // possible when a numbered button disapears like when equipping the last item
    // on a page
    if (this.page > this.numPages)
      useGameStore.getState().mutateState((state) => {
        getCurrentMenu(state).page = this.page - 1;
      });

    return toReturn;
  }
}

function itemButtonMouseLeaveHandler() {
  useGameStore.getState().mutateState((gameState) => {
    gameState.hoveredEntity = null;
  });
}

function itemButtonMouseEnterHandler(item: Item) {
  setItemHovered(item);
}

export function ItemButtonBody({
  children,
  thumbnailOption,
  gradientOverride,
  containerExtraStyles,
  imageExtraStyles,
  imageHoverStyles,
}: {
  children: ReactNode;
  gradientOverride?: string;
  containerExtraStyles?: string;
  thumbnailOption?: string;
  imageExtraStyles?: string;
  imageHoverStyles?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className={`h-full w-full relative ${containerExtraStyles}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`absolute right-0 w-7/12 h-full`}
        style={{ background: gradientOverride || gradientBg }}
      />
      {thumbnailOption && (
        <div
          className={`absolute right-0 h-full w-fit -rotate-90 transition-transform ${imageExtraStyles} ${isHovered ? imageHoverStyles : ""}`}
        >
          <img src={thumbnailOption} className="h-full object-fill " />
        </div>
      )}
      <div
        className="absolute z-10 w-full h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis"
        style={{
          textShadow: "2px 2px 0px #000000",
        }}
      >
        {children}
      </div>
    </div>
  );
}
