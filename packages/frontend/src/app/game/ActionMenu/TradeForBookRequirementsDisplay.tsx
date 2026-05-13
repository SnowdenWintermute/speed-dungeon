import React, { ReactNode } from "react";
import { BookConsumableType, ConsumableType } from "@speed-dungeon/common";

interface Props {
  bookType: BookConsumableType;
}

const BOOK_TRADE_ACCEPTED_EQUIPMENT_DESCRIPTIONS: Record<BookConsumableType, ReactNode> = {
  [ConsumableType.WarriorSkillbook]: (
    <span>
      a <span className="font-bold">one handed melee weapon with the strength attribute</span>
    </span>
  ),
  [ConsumableType.RogueSkillbook]: (
    <span>
      a{" "}
      <span className="font-bold">
        one handed slashing melee weapon with the dexterity or accuracy attribute
      </span>{" "}
      OR a{" "}
      <span className="font-bold">bow with the dexterity, accuracy or evasion attribute</span>
    </span>
  ),
  [ConsumableType.MageSkillbook]: (
    <span>
      a <span className="font-bold">wand or a staff with the intelligence attribute</span>
    </span>
  ),
};

export default function TradeForBookRequirementsDisplay({ bookType }: Props) {
  return (
    <div className="h-full bg-slate-700 p-2 border border-t-0 border-slate-400">
      <p className="mb-1">No items in your possession are accepted for this trade.</p>
      <p className="mb-1">
        This trade requires {BOOK_TRADE_ACCEPTED_EQUIPMENT_DESCRIPTIONS[bookType]}.
      </p>
      <p>
        Items must be <span className="font-bold">completely broken</span>.
      </p>
    </div>
  );
}
