import { useState } from "react";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";

interface Props {
  label: string;
  /** resolves to the path written, which the dev server reports back */
  write: () => Promise<string>;
  disabled: boolean;
  /** anything the reader has to do before the write takes effect */
  noteAfterWrite?: string;
}

/** the route only exists under `vite dev`, so these buttons are absent from a build */
export function WriteFileButton({ label, write, disabled, noteAfterWrite }: Props) {
  const [outcome, setOutcome] = useState<null | string>(null);
  const [failureReason, setFailureReason] = useState<null | string>(null);
  const [isWriting, setIsWriting] = useState(false);

  if (!import.meta.env.DEV) {
    return null;
  }

  async function handleClick() {
    setOutcome(null);
    setFailureReason(null);
    setIsWriting(true);

    try {
      setOutcome(await write());
    } catch (probablyError) {
      setFailureReason(
        probablyError instanceof Error ? probablyError.message : String(probablyError)
      );
    } finally {
      setIsWriting(false);
    }
  }

  return (
    <div className="">
      <ButtonBasic
        onClick={handleClick}
        disabled={disabled || isWriting}
        extraStyles="bg-theme-recessed"
      >
        {isWriting ? "writing..." : label}
      </ButtonBasic>

      <div className="h-10">
        {outcome !== null && (
          <span className="text-sm text-theme-muted">
            wrote {outcome}
            {noteAfterWrite !== undefined && ` (${noteAfterWrite})`}
          </span>
        )}
        {failureReason !== null && (
          <span className="text-sm text-theme-danger">{failureReason}</span>
        )}
      </div>
    </div>
  );
}
