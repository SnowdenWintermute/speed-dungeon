import * as RadixSlider from "@radix-ui/react-slider";

interface Props {
  title: string;
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  extraStyles?: string;
}

export function Slider(props: Props) {
  const { title, value, setValue, min, max, step, disabled, extraStyles } = props;

  return (
    <RadixSlider.Root
      value={[value]}
      onValueChange={([next]) => {
        if (next !== undefined) {
          setValue(next);
        }
      }}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`relative flex h-5 w-full touch-none select-none items-center pointer-events-auto
      data-[disabled]:opacity-50 ${extraStyles}`}
    >
      <RadixSlider.Track className="relative h-1 w-full bg-theme-base border border-theme-muted">
        <RadixSlider.Range className="absolute h-full bg-theme-muted" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        aria-label={title}
        className="block h-4 w-4 bg-theme-muted border border-theme-emphasis cursor-pointer
        hover:bg-theme-emphasis data-[disabled]:cursor-auto data-[disabled]:hover:bg-theme-muted
        focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2
        focus-visible:outline-theme-emphasis"
      />
    </RadixSlider.Root>
  );
}
