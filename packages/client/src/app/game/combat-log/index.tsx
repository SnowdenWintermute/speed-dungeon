import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import React, { useState } from "react";
import { CombatLogMessage, CombatLogMessageStyle } from "./combat-log-message";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";

export default function CombatLog() {
  const [expanded, setExpanded] = useState(false);
  const combatLogMessages = useGameStore().combatLogMessages;

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
          {combatLogMessages.map((message, i) => (
            <CombatLogMessageElement key={message.timestamp + i} message={message} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function CombatLogMessageElement({ message }: { message: CombatLogMessage }) {
  let color = "";
  switch (message.style) {
    case CombatLogMessageStyle.Basic:
      color = "text-slate-400";
      break;
    case CombatLogMessageStyle.Healing:
      color = "text-green-600";
      break;
    case CombatLogMessageStyle.PartyProgress:
      color = "text-yellow-400";
      break;
    case CombatLogMessageStyle.GameProgress:
      color = "text-teal-300";
      break;
    case CombatLogMessageStyle.PartyWipe:
      color = "text-red-400";
      break;
    case CombatLogMessageStyle.PartyEscape:
    case CombatLogMessageStyle.BattleVictory:
      color = "text-yellow-400";
      break;
    case CombatLogMessageStyle.LadderProgress:
      color = "text-purple-400";
  }

  return <li className={color}>{message.message}</li>;
}
