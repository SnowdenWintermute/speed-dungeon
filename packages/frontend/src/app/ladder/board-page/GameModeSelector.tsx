"use client";
import React from "react";
import { GAME_MODE_STRINGS, GameMode } from "@speed-dungeon/common";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";

// only the two modes with a ladder policy write floor clear records, so the others would be boards
// that can never have a row. progression games are not ranked at all, and an unranked race is
// unranked by definition
const LADDER_RECORDED_GAME_MODES = [GameMode.Ironman, GameMode.RankedRace];

const GAME_MODE_OPTIONS = LADDER_RECORDED_GAME_MODES.map((mode) => ({
  title: GAME_MODE_STRINGS[mode],
  value: mode,
}));

export function GameModeSelector({
  value,
  onChange,
}: {
  value: GameMode;
  onChange: (mode: GameMode) => void;
}) {
  return (
    <SelectDropdown
      title="game mode"
      value={value}
      setValue={onChange}
      options={GAME_MODE_OPTIONS}
      disabled={false}
    />
  );
}
