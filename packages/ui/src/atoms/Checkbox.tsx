import * as RadixCheckbox from "@radix-ui/react-checkbox";
import XShape from "@speed-dungeon/ui/assets/basic-shapes/x-shape.svg";
import { useHotkeysDisabled } from "../ui-context";
import { useHotkeys } from "../hooks/use-hotkeys";

interface Props {
  ariaLabel: string;
  checked: boolean;
  setChecked: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  hotkeys?: string[];
  extraStyles?: string;
}

export function Checkbox(props: Props) {
  const { ariaLabel, checked, setChecked, id, disabled, hotkeys, extraStyles } = props;
  const hotkeysDisabled = useHotkeysDisabled();

  useHotkeys({
    hotkeys,
    disabled: disabled === true || hotkeysDisabled,
    onActivate: () => setChecked(!checked),
  });

  return (
    <RadixCheckbox.Root
      id={id}
      aria-label={ariaLabel}
      aria-keyshortcuts={hotkeys?.join(" ")}
      checked={checked}
      onCheckedChange={(nextChecked) => setChecked(nextChecked === true)}
      disabled={disabled}
      className={`h-10 w-10 shrink-0 flex items-center justify-center pointer-events-auto
      bg-theme-base border border-theme-muted cursor-pointer hover:bg-theme-recessed
      disabled:opacity-50 disabled:cursor-auto disabled:hover:bg-theme-base
      focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2
      focus-visible:outline-theme-emphasis ${extraStyles}`}
    >
      {/* the mark is a share of the box rather than an inset, so overriding h/w is the only
      sizing knob a caller needs */}
      <RadixCheckbox.Indicator className="h-[60%] w-[60%]">
        <XShape className="h-full w-full fill-theme-emphasis" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
