import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AbilityTreeAbility, ClientToServerEvent, EntityId } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import React, { ReactNode, useState } from "react";
import { IconName, SVG_ICONS } from "@/app/icons";

interface Props {
  focusedCharacterId: EntityId;
  ability: AbilityTreeAbility;
  abilityLevel: number;
  buttonContent: ReactNode;
  isAllocatable: boolean;
}

export default function AbilityTreeButton(props: Props) {
  const [hovered, setHovered] = useState(false);
  const {
    focusedCharacterId: characterId,
    ability,
    abilityLevel,
    buttonContent,
    isAllocatable,
  } = props;

  const allocationIndicator = (
    <div className="absolute top-1 left-1 h-5 w-5 pointer-events-none animate-slide-appear-from-left">
      {SVG_ICONS[IconName.PlusSign]("h-full fill-zinc-300")}
    </div>
  );

  const disabled = !isAllocatable && abilityLevel <= 0;

  return (
    <HotkeyButton
      className={`
        h-20 w-20 border border-slate-400 bg-slate-700 hover:bg-slate-950 relative flex items-center justify-center
        ${disabled && "opacity-50 pointer-events-none cursor-pointer"}
        `}
      disabled={disabled}
      onClick={() => {
        websocketConnection.emit(ClientToServerEvent.AllocateAbilityPoint, {
          characterId,
          ability,
        });
      }}
      onMouseEnter={() => {
        useGameStore.getState().mutateState((state) => {
          state.hoveredCombatantAbility = ability;
          setHovered(true);
        });
      }}
      onMouseLeave={() => {
        useGameStore.getState().mutateState((state) => {
          state.hoveredCombatantAbility = null;
          setHovered(false);
        });
      }}
    >
      {hovered && isAllocatable && allocationIndicator}
      {buttonContent}
      <div className="absolute h-5 w-5 -bottom-1 -right-1 border border-zinc-300 bg-slate-700 text-center align-middle leading-tight">
        {abilityLevel}
      </div>
    </HotkeyButton>
  );
}
