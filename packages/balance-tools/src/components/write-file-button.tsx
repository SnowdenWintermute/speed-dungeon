import { useState } from "react";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";

interface Props {
  label: string;
  /** resolves to the path written, which the dev server reports back */
  write: () => Promise<string>;
  disabled: boolean;
  /** anything the reader has to do before the write takes effect */
  noteAfterWrite?: string;
}

/**
 * A write builds what it writes synchronously, so raising the writing flag is not enough on its own
 * — without letting the browser all the way through a paint, the spinner and the disabled state
 * would only appear once there was nothing left to wait for. Half a second of blocking hides them
 * just as completely as five would.
 */
function waitForPaint() {
  return new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(() => resolve(), 0))
  );
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
    await waitForPaint();

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
    <div>
      <ButtonBasic
        onClick={handleClick}
        disabled={disabled || isWriting}
        extraStyles="bg-theme-recessed"
      >
        {isWriting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4">
              <LoadingSpinner />
            </span>
            writing...
          </span>
        ) : (
          label
        )}
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
