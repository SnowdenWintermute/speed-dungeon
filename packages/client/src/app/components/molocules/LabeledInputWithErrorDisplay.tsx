import React from "react";
import TextInput from "../atoms/TextInput";

type Props = {
  name: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: any) => void;
  disabled?: boolean;
  autofocus?: boolean;
  autoComplete?: "on" | "off";
  error?: string;
  extraStyles?: string;
  dataCy?: string;
};

function LabeledTextInputWithErrorDisplay({
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  error,
  autofocus,
  autoComplete = "on",
  extraStyles = "",
  dataCy = "",
}: Props) {
  return (
    <label htmlFor={name} className={`${disabled && "opacity-70"} ${extraStyles}`}>
      <p className={`mb-2 ${error && "text-red-500"}`}>
        {label}
        {error && (
          <span id="error" role="alert" data-cy={`error-${name}`} className="">
            {` - ${error}`}
          </span>
        )}
      </p>
      <TextInput
        className={`pl-3 border border-slate-400 h-10 w-full bg-transparent autofill:bg-transparent disabled:opacity-70 ${error && "border border-red-500"} ${extraStyles}`}
        aria-label={name}
        type={type}
        placeholder={placeholder}
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e)}
        disabled={disabled}
        autofocus={autofocus}
        autoComplete={autoComplete === "on" ? "on" : "new-password"}
        aria-invalid={!!error}
        data-cy={dataCy}
      />
    </label>
  );
}

export default LabeledTextInputWithErrorDisplay;
