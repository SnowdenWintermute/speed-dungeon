import React from "react";
import { UserAuthStatus, UserChannelDisplayData } from "@speed-dungeon/common";
import { SPACING_REM_SMALL } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import StarShape from "../../../../public/img/basic-shapes/star.svg";

interface Props {
  username: string;
  displayData: UserChannelDisplayData;
}

export default function UserPlaque({ username, displayData }: Props) {
  const thisTabUsername = useGameStore().username;
  const bgStyle = displayData.authStatus === UserAuthStatus.Guest ? "bg-slate-700" : "bg-slate-950";
  let thisIsYouMarker = <span />;
  if (thisTabUsername === username)
    thisIsYouMarker = (
      <HoverableTooltipWrapper tooltipText="This is you">
        <div className="mr-2 h-4 w-4">
          <StarShape className="fill-slate-400 h-full w-full" />
        </div>
      </HoverableTooltipWrapper>
    );

  return (
    <li
      className={`h-10 ${bgStyle} border border-slate-400 flex items-center mb-2 pl-2 pointer-events-auto`}
      style={{
        marginRight: `${SPACING_REM_SMALL}rem`,
      }}
    >
      {thisIsYouMarker}
      <div className="overflow-hidden whitespace-nowrap text-ellipsis">{username}</div>
    </li>
  );
}
