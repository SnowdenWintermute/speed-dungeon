"use client";
import React from "react";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  CharacterControlScheme,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";

const CONTROL_SCHEME_OPTIONS = iterateNumericEnumKeyedRecord(CHARACTER_CONTROL_SCHEME_STRINGS).map(
  ([controlScheme, title]) => ({ title, value: controlScheme })
);

export function ControlSchemeSelector({
  value,
  onChange,
}: {
  value: CharacterControlScheme;
  onChange: (controlScheme: CharacterControlScheme) => void;
}) {
  return (
    <SelectDropdown
      title="control scheme"
      value={value}
      setValue={onChange}
      options={CONTROL_SCHEME_OPTIONS}
      disabled={false}
    />
  );
}
