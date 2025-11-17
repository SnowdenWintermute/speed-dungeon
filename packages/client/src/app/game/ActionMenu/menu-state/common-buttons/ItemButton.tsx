import { EQUIPMENT_ICONS } from "@/app/game/detailables/EquipmentDetails/equipment-icons";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { AppStore } from "@/mobx-stores/app-store";
import { ModifierKey } from "@/mobx-stores/input";
import { createEaseGradient } from "@/utils/create-ease-gradient-style";
import { Color4 } from "@babylonjs/core";
import {
  APP_BASE_TEXT_COLOR,
  Consumable,
  CONSUMABLE_TEXT_COLOR,
  CONSUMABLE_TURQUOISE,
  CONSUMABLE_TYPE_STRINGS,
  Equipment,
  Item,
  MAGICAL_PROPERTY_BLUE_TEXT,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { observer } from "mobx-react-lite";
import { ReactNode, useState } from "react";
import { postItemLink } from "@/utils/post-item-link";
import { ActionMenuNumberedButton } from "./ActionMenuNumberedButton";

interface Props {
  item: Item;
  text: string;
  hotkeyLabel: string;
  hotkeys: string[];
  clickHandler: (item: Item) => void;
  disabled: boolean;
  children?: ReactNode;
}

export const ItemButton = observer((props: Props) => {
  const [isHovered, setIsHovered] = useState(false);
  const alternateClickKeyHeld = AppStore.get().inputStore.getKeyIsHeld(ModifierKey.AlternateClick);

  const { item, text, hotkeyLabel, hotkeys, children, disabled } = props;

  const thumbnailOption = getItemButtonThumbnail(item);

  let svgIconOption;
  if (!thumbnailOption && item instanceof Equipment) {
    const { equipmentType } = item.equipmentBaseItemProperties;
    svgIconOption = EQUIPMENT_ICONS[equipmentType]("h-full fill-slate-400", {});
  }

  const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  const { attributeProperties } = focusedCharacter.combatantProperties;
  const totalAttributes = attributeProperties.getTotalAttributes();
  const itemIsNotBroken = !(item instanceof Equipment && item.isBroken());
  const requirementsMet = Item.requirementsMet(item, totalAttributes) && itemIsNotBroken;

  const background = getItemButtonBackgroundGradient(item, requirementsMet);
  const textColor = getItemButtonTextColor(item, requirementsMet);

  const { mainContainerStyles, imageContainerStyles } = getItemButtonConditionalStyles(
    item,
    isHovered,
    alternateClickKeyHeld
  );

  function focusHandler() {
    const { focusStore } = AppStore.get();
    focusStore.detailables.setHovered(item);
    setIsHovered(true);
  }

  function blurHandler() {
    const { focusStore } = AppStore.get();
    focusStore.detailables.clearHovered();
    setIsHovered(false);
  }

  function clickHandler() {
    if (alternateClickKeyHeld) postItemLink(item);
    else props.clickHandler(item);
  }

  return (
    <ActionMenuNumberedButton
      extraStyles={mainContainerStyles + " relative overflow-hidden"}
      hotkeys={hotkeys}
      focusHandler={focusHandler}
      blurHandler={blurHandler}
      clickHandler={clickHandler}
      hotkeyLabel={hotkeyLabel}
      disabled={disabled}
    >
      <div className={`absolute right-0 w-7/12 h-full`} style={{ background }} />

      <div className={`${textColor} flex justify-between h-full w-full pr-2`}>
        {thumbnailOption && (
          <div
            className={`absolute right-0 h-full w-fit -rotate-90 transition-transform ${imageContainerStyles}`}
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
          {text}
          {children}
        </div>
      </div>
    </ActionMenuNumberedButton>
  );
});

const hexRed = "#563D45"; // eye droppered from paper doll slot disabled with filter
const GREEN = Color4.FromHexString(CONSUMABLE_TURQUOISE).scale(255);
const RED = Color4.FromHexString(hexRed).scale(255);
const GRAY = new Color4(0.55, 0.55, 0.55, 1.0).scale(255);
const TRANSPARENT = cloneDeep(GRAY);
TRANSPARENT.a = 0;
const gradientBg = createEaseGradient(TRANSPARENT, GRAY, 1, 25);
const consumableGradientBg = createEaseGradient(TRANSPARENT, GREEN, 1, 25);
const unmetRequirementsGradientBg = createEaseGradient(TRANSPARENT, RED, 1, 25);

function getItemButtonTextColor(item: Item, requirementsMet: boolean) {
  if (!requirementsMet) {
    return UNMET_REQUIREMENT_TEXT_COLOR;
  } else if (item instanceof Consumable) {
    return CONSUMABLE_TEXT_COLOR;
  } else if (item instanceof Equipment && item.isMagical()) {
    return MAGICAL_PROPERTY_BLUE_TEXT;
  } else {
    return APP_BASE_TEXT_COLOR;
  }
}

function getItemButtonBackgroundGradient(item: Item, requirementsMet: boolean) {
  if (!requirementsMet) return unmetRequirementsGradientBg;
  else if (item instanceof Consumable) return consumableGradientBg;
  else return gradientBg;
}

function getItemButtonConditionalStyles(
  item: Item,
  isHovered: boolean,
  alternateClickKeyHeld: boolean
) {
  const imageContainerStyles: string[] = [];
  let mainContainerStyles = "";

  if (alternateClickKeyHeld) mainContainerStyles = "cursor-alias";
  if (isHovered) imageContainerStyles.push("-translate-x-[55px]");
  const itemIsWeapon = item instanceof Equipment && !(item.getWeaponProperties() instanceof Error);
  const itemIsConsumable = item instanceof Consumable;
  if (itemIsWeapon || itemIsConsumable) imageContainerStyles.push("scale-[300%]");
  else imageContainerStyles.push("scale-[200%] -translate-x-1/2 p-[2px]");
  return { imageContainerStyles: imageContainerStyles.join(" "), mainContainerStyles };
}

function getItemButtonThumbnail(item: Item) {
  let thumbnailId = item.entityProperties.id;
  if (item instanceof Consumable) {
    thumbnailId = CONSUMABLE_TYPE_STRINGS[item.consumableType];
  }
  return AppStore.get().imageStore.getItemThumbnailOption(thumbnailId);
}
