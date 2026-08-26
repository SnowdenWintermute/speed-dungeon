import { useId } from "react";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";

interface Props<T> {
  title: string;
  value: T;
  setValue: (value: T) => void;
  options: { title: string; value: T; disabled?: boolean }[];
  disabled?: boolean;
  extraStyles?: string;
}

// radix addresses options by string, so the index stands in for values of any type
export function RadioGroup<T>(props: Props<T>) {
  const { title, options, value, setValue, disabled } = props;
  const idPrefix = useId();
  const indexSelected = options.findIndex((option) => option.value === value);

  return (
    <RadixRadioGroup.Root
      aria-label={title}
      value={indexSelected === -1 ? undefined : `${indexSelected}`}
      onValueChange={(selected) => {
        const option = options[parseInt(selected)];
        if (option === undefined) {
          return;
        }
        setValue(option.value);
      }}
      disabled={disabled}
      className={`flex items-center gap-4 pointer-events-auto ${props.extraStyles}`}
    >
      {options.map((option, i) => {
        const id = `${idPrefix}-${i}`;
        return (
          <div className="flex items-center" key={id}>
            <RadixRadioGroup.Item
              id={id}
              value={`${i}`}
              disabled={option.disabled}
              className="h-5 w-5 mr-2 flex items-center justify-center bg-theme-base
              border border-theme-muted disabled:opacity-50 disabled:cursor-auto cursor-pointer
              focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2
              focus-visible:outline-theme-emphasis"
            >
              <RadixRadioGroup.Indicator className="h-3 w-3 bg-theme-muted" />
            </RadixRadioGroup.Item>
            <label
              htmlFor={id}
              className={`cursor-pointer ${option.disabled || disabled ? "opacity-50 cursor-auto" : ""}`}
            >
              {option.title}
            </label>
          </div>
        );
      })}
    </RadixRadioGroup.Root>
  );
}
