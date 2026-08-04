"use client";
import React from "react";
import { DEEPEST_FLOOR } from "@speed-dungeon/common";
import { SelectDropdown } from "@speed-dungeon/ui/atoms/SelectDropdown";

// floor zero is the town, so the shallowest floor anyone clears is one
const FLOOR_OPTIONS = Array.from({ length: DEEPEST_FLOOR }, (_, index) => ({
  title: `Floor ${index + 1}`,
  value: index + 1,
}));

export function FloorSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (floor: number) => void;
}) {
  return (
    <SelectDropdown
      title="floor"
      value={value}
      setValue={onChange}
      options={FLOOR_OPTIONS}
      disabled={false}
    />
  );
}
