import React from "react";
import { ClientToServerEvent, Item } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";
import { ItemButton } from "../ActionMenu/menu-state/common-buttons/ItemButton";

interface Props {
  item: Item;
  disabled: boolean;
}

export function takeItem(item: Item) {
  const { focusStore, gameStore } = AppStore.get();

  focusStore.detailables.clear();

  websocketConnection.emit(ClientToServerEvent.PickUpItems, {
    characterId: gameStore.getExpectedFocusedCharacterId(),
    itemIds: [item.entityProperties.id],
  });
}

export const ItemOnGround = observer((props: Props) => {
  const { focusStore } = AppStore.get();

  const { item } = props;
  function mouseEnterHandler() {
    focusStore.detailables.setHovered(item);
  }
  function mouseLeaveHandler() {
    focusStore.detailables.clearHovered();
  }
  function clickHandler() {
    focusStore.selectItem(item);
  }

  const itemIsDetailed = focusStore.entityIsDetailed(item.entityProperties.id);
  const itemIsHovered = focusStore.entityIsHovered(item.entityProperties.id);

  const conditionalClassNames = (() => {
    if (itemIsDetailed) return "border-yellow-400 hover:border-t";
    if (itemIsHovered) return "border-white hover:border-t";
    return "";
  })();

  return (
    <li
      className={`h-10 w-full max-w-full flex border-r border-l border-b border-slate-400 first:border-t
                      box-border
                      whitespace-nowrap text-ellipsis overflow-hidden cursor-default ${conditionalClassNames}`}
      onMouseEnter={mouseEnterHandler}
      onMouseLeave={mouseLeaveHandler}
    >
      <button
        className="cursor-pointer pr-4 pl-4 box-border
            flex justify-center items-center disabled:opacity-50 disabled:cursor-auto
            border-slate-400 border-r h-full hover:bg-slate-950"
        onClick={() => takeItem(item)}
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
