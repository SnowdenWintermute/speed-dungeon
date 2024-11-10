import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import React from "react";
import { CombatLogMessage, CombatLogMessageStyle } from "./combat-log-message";

export default function CombatLog() {
  const combatLogMessages = useGameStore().combatLogMessages;

  return (
    <div className="h-full flex flex-col pointer-events-auto">
      <h3 className="flex-grow-0 flex-shrink">Message Log</h3>
      <Divider />
      <div className="list-none overflow-y-auto flex flex-col-reverse flex-1">
        <ul>
          {combatLogMessages.map((message, i) => (
            <CombatLogMessageElement
              key={message.timestamp + message.message + i}
              message={message}
            />
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
