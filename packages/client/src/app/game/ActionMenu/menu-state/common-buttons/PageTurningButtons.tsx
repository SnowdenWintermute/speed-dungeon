import React from "react";
import { ActionMenuState } from "..";
import { observer } from "mobx-react-lite";
import { ListCyclingButtons } from "./ListCyclingButtons";

interface Props {
  menuState: ActionMenuState;
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
