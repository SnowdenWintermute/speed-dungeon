interface Props<T> {
  title: string;
  value: T;
  setValue: (value: T) => void;
  options: { title: string; value: T }[];
  extraStyles?: string;
}

export function TabBar<T>({ title, value, setValue, options, extraStyles }: Props<T>) {
  return (
    <ul aria-label={title} className={`flex border-b border-theme-muted ${extraStyles ?? ""}`}>
      {options.map((option) => (
        <li key={option.title}>
          <button
            className={`h-10 px-4 border-r border-theme-muted cursor-pointer hover:bg-theme-recessed ${
              option.value === value ? "bg-theme-recessed" : ""
            }`}
            onClick={() => {
              setValue(option.value);
            }}
          >
            {option.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
