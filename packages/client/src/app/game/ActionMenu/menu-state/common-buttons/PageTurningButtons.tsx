import React from "react";
import { ActionMenuScreen as ActionMenuScreenOld } from "../index";
import { observer } from "mobx-react-lite";
import { ListCyclingButtons } from "./ListCyclingButtons";
import { ActionMenuScreen } from "@/client-application/action-menu/screens";

interface Props {
  menuState: ActionMenuScreen | ActionMenuScreenOld;
}

export const PageTurningButtons = observer((props: Props) => {
  const { menuState } = props;
  const pageCount = menuState.getPageCount();
  const currentPageIndex = menuState.pageIndex;

  return (
    <ListCyclingButtons
      onCycle={(direction) => {
        menuState.turnPage(direction);
      }}
      itemCount={pageCount}
      currentIndex={currentPageIndex}
      listTitle={"Page"}
    />
  );
});
