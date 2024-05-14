import { ChangeEvent } from "react";

interface Props {
  placeholder: string;
  name: string;
  changeHandler: (e: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}

export default function TextInput(props: Props) {
  return (
    <input
      className="bg-slate-700 border border-slate-400 h-10 p-4"
      type="text"
      placeholder={props.placeholder}
      name={props.name}
      onChange={props.changeHandler}
      value={props.value}
    />
  );
}
