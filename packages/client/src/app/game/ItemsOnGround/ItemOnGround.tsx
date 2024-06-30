import React from "react";

interface Props {
  id: string;
  name: string;
  disabled: boolean;
}

export default function ItemOnGround(props: Props) {
  function mouseEnterHandler() {}
  function mouseLeaveHandler() {}
  function focusHandler() {}
  function blurHandler() {}
  function clickHandler() {}

  function takeItem() {}

  const conditionalClassNames = "";

  return (
    <li
      className={`h-10 w-full max-w-full flex border-r border-l border-b border-slate-400 first:border-t
                      box-border
                      whitespace-nowrap text-ellipsis overflow-hidden cursor-default ${conditionalClassNames}`}
      onMouseEnter={mouseEnterHandler}
      onMouseLeave={mouseLeaveHandler}
    >
      <button
        className="cursor-pointer pr-4 pl-4 box-border
            flex justify-center items-center disabled:opacity-50 disabled:cursor-auto
            border-slate-400 border-r h-full hover:bg-slate-950"
        onClick={takeItem}
        onFocus={focusHandler}
        onBlur={blurHandler}
        disabled={props.disabled}
      >
        {"Take"}
      </button>
      <button onClick={clickHandler} className="flex items-center h-full w-full ">
        <span className="pl-2 overflow-hidden whitespace-nowrap text-ellipsis ">{props.name}</span>
      </button>
    </li>
  );
}
