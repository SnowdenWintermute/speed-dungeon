import Divider from "@/app/components/atoms/Divider";
import React, { useState } from "react";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { observer } from "mobx-react-lite";
import {
  GAME_LOG_MESSAGE_STYLE_STRINGS,
  GameLogMessage,
} from "@/mobx-stores/game-event-notifications/game-log-messages";
import { AppStore } from "@/mobx-stores/app-store";

export const GameLog = observer(() => {
  const [expanded, setExpanded] = useState(false);
  const gameLogMessages = AppStore.get().gameEventNotificationStore.getGameLogMessages();

  const expandedStyle = expanded
    ? "absolute bg-slate-700 p-2 top-0 right-0 h-screen w-screen"
    : "h-full";

  const expandButtonText = expanded ? "Restore (L)" : "Maximize (L)";

  return (
    <div className={`flex flex-col pointer-events-auto ${expandedStyle}`}>
      <div className="flex justify-between">
        <h3 className="flex-grow-0 flex-shrink">Message Log</h3>
        <HotkeyButton
          onClick={() => {
            setExpanded(!expanded);
          }}
          hotkeys={["KeyL"]}
        >
          {expandButtonText}
        </HotkeyButton>
      </div>
      <Divider />
      <div className="list-none overflow-y-auto flex flex-col-reverse flex-1 pb-[4px]">
        <ul>
          {gameLogMessages.map((message, i) => (
            <GameLogMessageElement key={message.timestamp + i} message={message} />
          ))}
        </ul>
      </div>
    </div>
  );
});

function GameLogMessageElement({ message }: { message: GameLogMessage }) {
  const color = GAME_LOG_MESSAGE_STYLE_STRINGS[message.style];

  return <li className={color}>{message.message}</li>;
}
