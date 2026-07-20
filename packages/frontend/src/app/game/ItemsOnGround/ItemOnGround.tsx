import React from "react";
import { Item } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { ItemButton } from "../ActionMenu/menu-state/common-buttons/ItemButton";
import { ClientApplication } from "@/client-application";
import { DragSourceType } from "@/client-application/item-drag/types";
import { useDragSource } from "@/app/game/item-drag/use-drag-source";

interface Props {
  item: Item;
  disabled: boolean;
}

export function takeItem(clientApplication: ClientApplication, item: Item) {
  const { itemCommands, detailableEntityFocus, combatantFocus } = clientApplication;

  detailableEntityFocus.detailables.clear();

  itemCommands.pickUpItems(combatantFocus.requireFocusedCharacterId(), [item.getEntityId()]);
}

export const ItemOnGround = observer((props: Props) => {
  const clientApplication = useClientApplication();
  const { detailableEntityFocus, dragService } = clientApplication;

  const { item } = props;
  const isDragging = dragService.isDragging();

  const dragHandlers = useDragSource(() =>
    props.disabled ? null : { type: DragSourceType.GroundItem, item }
  );
  const onPointerDown = props.disabled ? undefined : dragHandlers.onPointerDown;

  function mouseEnterHandler() {
    detailableEntityFocus.detailables.setHovered(item);
  }
  function mouseLeaveHandler() {
    detailableEntityFocus.detailables.clearHovered();
  }
  function clickHandler() {
    detailableEntityFocus.selectItem(item);
  }

  const itemIsDetailed = detailableEntityFocus.entityIsDetailed(item.entityProperties.id);
  const itemIsHovered = detailableEntityFocus.entityIsHovered(item.entityProperties.id);

  const conditionalClassNames = (() => {
    if (itemIsDetailed) return "border-yellow-400 hover:border-t";
    if (itemIsHovered) return "border-white hover:border-t";
    return "";
  })();

  return (
    <li
      className={`h-10 w-full max-w-full flex border-r border-l border-b border-slate-400 first:border-t
                      box-border
                      whitespace-nowrap text-ellipsis overflow-hidden cursor-default ${conditionalClassNames} ${isDragging ? "pointer-events-none" : ""}`}
      onMouseEnter={mouseEnterHandler}
      onMouseLeave={mouseLeaveHandler}
      onPointerDown={onPointerDown}
    >
      <button
        className="cursor-pointer pr-4 pl-4 box-border
            flex justify-center items-center disabled:opacity-50 disabled:cursor-auto
            border-slate-400 border-r h-full hover:bg-slate-950"
        onClick={() => takeItem(clientApplication, item)}
        onFocus={mouseEnterHandler}
        onBlur={mouseLeaveHandler}
        disabled={props.disabled}
      >
        {"Take"}
      </button>
      <ItemButton
        clickHandler={clickHandler}
        item={item}
        text={item.entityProperties.name}
        hotkeyLabel={""}
        hotkeys={[]}
        disabled={false}
      ></ItemButton>
    </li>
  );
});
