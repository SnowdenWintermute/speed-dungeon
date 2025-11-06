import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { EQUIPMENT_ICONS } from "@/app/game/detailables/EquipmentDetails/equipment-icons";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { AppStore } from "@/mobx-stores/app-store";
import { ModifierKey } from "@/mobx-stores/input";
import { createEaseGradient } from "@/utils/create-ease-gradient-style";
import { Color4 } from "@babylonjs/core";
import {
  Consumable,
  CONSUMABLE_TEXT_COLOR,
  CONSUMABLE_TURQUOISE,
  Equipment,
  EquipmentBaseItem,
  Item,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { observer } from "mobx-react-lite";
import { ReactNode, useState } from "react";

const hexRed = "#563D45"; // eye droppered from paper doll slot disabled with filter
const GREEN = Color4.FromHexString(CONSUMABLE_TURQUOISE).scale(255);
const RED = Color4.FromHexString(hexRed).scale(255);
const GRAY = new Color4(0.55, 0.55, 0.55, 1.0).scale(255);
const TRANSPARENT = cloneDeep(GRAY);
TRANSPARENT.a = 0;
const gradientBg = createEaseGradient(TRANSPARENT, GRAY, 1, 25);
export const consumableGradientBg = createEaseGradient(TRANSPARENT, GREEN, 1, 25);
export const unmetRequirementsGradientBg = createEaseGradient(TRANSPARENT, RED, 1, 25);

export const ItemButton = observer(
  ({
    item,
    children,
    thumbnailOption,
    imageExtraStyles,
    imageHoverStyles,
    alternateClickStyle,
    equipmentBaseItem,
  }: {
    item: Item;
    children?: ReactNode;
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

    if (!thumbnailOption && equipmentBaseItem !== undefined) {
      svgIconOption = EQUIPMENT_ICONS[equipmentBaseItem.equipmentType]("h-full fill-slate-400", {});
    }

    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const requirementsMet =
      Item.requirementsMet(
        item,
        focusedCharacter.combatantProperties.attributeProperties.getTotalAttributes()
      ) && !(item instanceof Equipment && item.isBroken());

    let background = gradientBg;
    let textColor = item instanceof Consumable ? CONSUMABLE_TEXT_COLOR : "text-zinc-300";
    if (!requirementsMet) {
      background = unmetRequirementsGradientBg;
      textColor = UNMET_REQUIREMENT_TEXT_COLOR;
    }

    return (
      <HotkeyButton
        className={`h-full w-full relative ${textColor} ${alternateClickKeyHeld && alternateClickStyle}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`absolute right-0 w-7/12 h-full`} style={{ background }} />
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
          {item.entityProperties.name}
          {children}
        </div>
      </HotkeyButton>
    );
  }
);
