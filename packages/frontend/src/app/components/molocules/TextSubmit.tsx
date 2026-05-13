"use client";
import { ChangeEvent, useState } from "react";
import ButtonBasic from "../atoms/ButtonBasic";
import TextInput from "../atoms/TextInput";

interface Props {
  inputPlaceholder: string;
  inputName: string;
  submitHandlerCallback: (data: string) => void;
  buttonTitle: string;
  submitDisabled: boolean;
  inputStyles?: string;
  type?: string;
  min?: number;
  max?: number;
  autofocus?: boolean;
}

export default function TextSubmit(props: Props) {
  const [value, setValue] = useState("");
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
  }

  function submitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    props.submitHandlerCallback(value);
  }

  return (
    <form className="flex" onSubmit={submitHandler}>
      <TextInput
        autofocus={props.autofocus}
        className={props.inputStyles}
        name={props.inputName}
        placeholder={props.inputPlaceholder}
        onChange={handleInputChange}
        type={props.type}
        value={value}
        min={props.min}
        max={props.max}
      />
      <ButtonBasic
        disabled={props.submitDisabled}
        extraStyles="border-l-0 bg-slate-700"
        buttonType="submit"
      >
        {props.buttonTitle}
      </ButtonBasic>
    </form>
  );
}
