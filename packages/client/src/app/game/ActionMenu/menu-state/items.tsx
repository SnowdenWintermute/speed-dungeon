import { getCurrentMenu, useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  CONSUMABLE_TEXT_COLOR,
  CONSUMABLE_TURQUOISE,
  CONSUMABLE_TYPE_STRINGS,
  CombatantProperties,
  Consumable,
  ConsumableType,
  Equipment,
  EquipmentBaseItem,
  EquipmentType,
  Item,
  getSkillBookName,
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
import { useUIStore } from "@/stores/ui-store";
import { postItemLink } from "@/utils/post-item-link";

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
  alwaysShowPageOne = false;
  getCenterInfoDisplayOption: null | (() => ReactNode) = null;
  constructor(
    public type:
      | MenuStateType.InventoryItems
      | MenuStateType.ViewingEquipedItems
      | MenuStateType.ItemsOnGround
      | MenuStateType.CraftingItemSelection
      | MenuStateType.PurchasingItems
      | MenuStateType.RepairItemSelection
      | MenuStateType.ShardItemSelection
      | MenuStateType.SelectItemToTradeForBook,
    private closeMenuTextAndHotkeys: { text: string; hotkeys: string[] },
    private itemButtonClickHandler: (item: Item) => void,
    private getItemsToShow: () => Item[],
    private options: {
      getItemButtonCustomChildren?: (item: Item) => ReactNode;
      extraButtons?: Partial<Record<ActionButtonCategory, ActionMenuButtonProperties[]>>;
      shouldBeDisabled?: (item: Item) => boolean;
      getCenterInfoDisplayOption?: () => ReactNode;
    }
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const closeInventory = new ActionMenuButtonProperties(
      () => this.closeMenuTextAndHotkeys.text,
      this.closeMenuTextAndHotkeys.text,
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.pop();
          state.hoveredEntity = null;
          state.consideredItemUnmetRequirements = null;
        });
        AppStore.get().dialogStore.close(DialogElementName.DropShards);
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

    const buttonTextPrefix = this.type === MenuStateType.ItemsOnGround ? "" : "";

    const itemsToShow = this.getItemsToShow();

    if (itemsToShow.length === 0 && this.type !== MenuStateType.ItemsOnGround) {
      toReturn[ActionButtonCategory.Numbered].push(
        new ActionMenuButtonProperties(
          () => <div>The list of items is empty...</div>,
          itemsToShow.length.toString(),
          () => {}
        )
      );
    }

    const { equipmentAndShardStacks, consumablesByTypeAndLevel } = sortItemsIntoStacks(itemsToShow);

    for (const [consumableType, consumableStacksByLevel] of iterateNumericEnumKeyedRecord(
      consumablesByTypeAndLevel
    )) {
      const entries = Object.entries(consumableStacksByLevel);
      for (const [itemLevelString, consumableStack] of entries) {
        const itemLevel = parseInt(itemLevelString);

        const firstConsumableOfThisType = consumableStack[0];
        if (!firstConsumableOfThisType) continue;

        let consumableName = buttonTextPrefix + getSkillBookName(consumableType, itemLevel);
        if (consumableStack.length > 1) consumableName += ` (${consumableStack.length})`;

        const thumbnailId = CONSUMABLE_TYPE_STRINGS[consumableType];
        const thumbnailOption = useGameStore.getState().itemThumbnails[thumbnailId];

        let containerExtraStyles = CONSUMABLE_TEXT_COLOR;

        const button = new ActionMenuButtonProperties(
          () => (
            <ItemButtonBody
              thumbnailOption={thumbnailOption}
              gradientOverride={consumableGradientBg}
              containerExtraStyles={containerExtraStyles}
              imageExtraStyles="scale-[300%]"
              imageHoverStyles="-translate-x-[55px]"
              alternateClickStyle="cursor-alias"
            >
              {consumableName}
              {this.options.getItemButtonCustomChildren &&
                this.options.getItemButtonCustomChildren(firstConsumableOfThisType)}
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
        button.alternateClickHandler = () => postItemLink(firstConsumableOfThisType);
        button.shouldBeDisabled = this.options.shouldBeDisabled
          ? this.options.shouldBeDisabled(firstConsumableOfThisType)
          : false;
        toReturn[ActionButtonCategory.Numbered].push(button);
      }
    }

    for (const item of equipmentAndShardStacks) {
      const thumbnailOption = useGameStore.getState().itemThumbnails[item.entityProperties.id];
      const buttonText = buttonTextPrefix + item.entityProperties.name;
      let imageExtraStyles =
        item instanceof Equipment && Equipment.isWeapon(item)
          ? "scale-[300%]"
          : "scale-[200%] -translate-x-1/2 p-[2px]";

      const requirementsMet =
        Item.requirementsMet(
          item,
          CombatantProperties.getTotalAttributes(focusedCharacterResult.combatantProperties)
        ) && !(item instanceof Equipment && Equipment.isBroken(item));

      let containerExtraStyles = "";
      if (!requirementsMet) {
        containerExtraStyles += ` ${UNMET_REQUIREMENT_TEXT_COLOR}`;

        imageExtraStyles += " filter-red";
      } else if (item instanceof Equipment && Equipment.isMagical(item)) {
        containerExtraStyles += " text-blue-300";
      }
      const button = new ActionMenuButtonProperties(
        () => (
          <ItemButtonBody
            containerExtraStyles={containerExtraStyles}
            imageExtraStyles={imageExtraStyles}
            gradientOverride={!requirementsMet ? unmetRequirementsGradientBg : ""}
            thumbnailOption={thumbnailOption}
            imageHoverStyles="-translate-x-[55px]"
            alternateClickStyle="cursor-alias"
            equipmentBaseItem={
              item instanceof Equipment
                ? item.equipmentBaseItemProperties.taggedBaseEquipment
                : undefined
            }
          >
            {buttonText}
            {this.options.getItemButtonCustomChildren &&
              this.options.getItemButtonCustomChildren(item)}
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
      button.alternateClickHandler = () => postItemLink(item);
      button.shouldBeDisabled = this.options.shouldBeDisabled
        ? this.options.shouldBeDisabled(item)
        : false;
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    createPageButtons(this, toReturn);

    if (!this.options.extraButtons) return toReturn;

    for (const [category, buttons] of iterateNumericEnumKeyedRecord(this.options.extraButtons)) {
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

import AmuletIcon from "../../../../../public/img/equipment-icons/amulet.svg";
import RingIcon from "../../../../../public/img/equipment-icons/ring-flattened.svg";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { ModifierKey } from "@/mobx-stores/input";
import { observer } from "mobx-react-lite";

export const ItemButtonBody = observer(
  ({
    children,
    thumbnailOption,
    gradientOverride,
    containerExtraStyles,
    imageExtraStyles,
    imageHoverStyles,
    alternateClickStyle,
    equipmentBaseItem,
  }: {
    children: ReactNode;
    gradientOverride?: string;
    containerExtraStyles?: string;
    thumbnailOption?: string;
    imageExtraStyles?: string;
    imageHoverStyles?: string;
    alternateClickStyle?: string;
    equipmentBaseItem?: EquipmentBaseItem;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const alternateClickKeyHeld = AppStore.get().inputStore.getKeyIsHeld(
      ModifierKey.AlternateClick
    );

    let svgIconOption;

    if (!thumbnailOption) {
      if (equipmentBaseItem?.equipmentType === EquipmentType.Amulet) {
        svgIconOption = <AmuletIcon className="h-full fill-slate-400" />;
      }
      if (equipmentBaseItem?.equipmentType === EquipmentType.Ring) {
        svgIconOption = <RingIcon className="h-full fill-slate-400" />;
      }
    }

    return (
      <div
        className={`h-full w-full relative ${containerExtraStyles} ${alternateClickKeyHeld && alternateClickStyle}`}
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
        {svgIconOption && (
          <div
            className={`absolute right-0 w-1 top-1/2 -translate-x-1/2 h-full flex justify-center  transition-transform ${isHovered ? "-translate-x-[50px]" : ""}`}
          >
            <div className="w-10 h-10 p-1 -translate-y-1/2 ">{svgIconOption}</div>
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
);

function sortItemsIntoStacks(itemsToShow: Item[]) {
  const equipmentAndShardStacks: Item[] = [];
  const consumablesByTypeAndLevel: Partial<Record<ConsumableType, Record<number, Consumable[]>>> =
    {};

  for (const item of itemsToShow) {
    const isEquipment = item instanceof Equipment;
    const isConsumable = item instanceof Consumable;
    const isShardStack = isConsumable && item.consumableType === ConsumableType.StackOfShards;
    const shouldNotStack = isEquipment || isShardStack;

    if (shouldNotStack) equipmentAndShardStacks.push(item);
    else if (isConsumable) {
      const { consumableType } = item;
      const existingConsumableTypeLevelStacks = consumablesByTypeAndLevel[consumableType];

      if (!existingConsumableTypeLevelStacks)
        consumablesByTypeAndLevel[consumableType] = { [item.itemLevel]: [item] };
      else {
        const existingLevelStackOption = existingConsumableTypeLevelStacks[item.itemLevel];
        if (existingLevelStackOption) existingLevelStackOption.push(item);
        else existingConsumableTypeLevelStacks[item.itemLevel] = [item];
      }
    }
  }

  return { equipmentAndShardStacks, consumablesByTypeAndLevel };
}
