import * as RadixCheckbox from "@radix-ui/react-checkbox";

interface Props {
  ariaLabel: string;
  checked: boolean;
  setChecked: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  extraStyles?: string;
}

export function Checkbox(props: Props) {
  const { ariaLabel, checked, setChecked, id, disabled, extraStyles } = props;

  return (
    <RadixCheckbox.Root
      id={id}
      aria-label={ariaLabel}
      checked={checked}
      onCheckedChange={(nextChecked) => setChecked(nextChecked === true)}
      disabled={disabled}
      className={`h-10 w-10 p-2 shrink-0 flex items-center justify-center pointer-events-auto
      bg-theme-base border border-theme-muted cursor-pointer hover:bg-theme-recessed
      disabled:opacity-50 disabled:cursor-auto disabled:hover:bg-theme-base
      focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2
      focus-visible:outline-theme-emphasis ${extraStyles}`}
    >
      <RadixCheckbox.Indicator className="h-full w-full">
        <svg viewBox="0 0 16 16" className="h-full w-full fill-theme-emphasis">
          <rect
            x="0.221802"
            y="1.63608"
            width="1"
            height="20"
            transform="rotate(-45 0.221802 1.63608)"
          />
          <rect
            width="1"
            height="20"
            transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 15.5564 1.41422)"
          />
        </svg>
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
