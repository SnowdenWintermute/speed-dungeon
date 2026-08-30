import { useState } from "react";

/** a study can pin a control to one value, in which case what the user last chose stops counting */
export function useFixableState<T>(fixed: undefined | T, fallback: T) {
  const [chosen, setChosen] = useState(fixed ?? fallback);

  return { value: fixed ?? chosen, isFixed: fixed !== undefined, setChosen };
}
