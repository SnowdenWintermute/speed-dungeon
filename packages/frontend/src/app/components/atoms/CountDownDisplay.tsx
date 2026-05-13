import { useEffect, useState } from "react";
import React from "react";

export default function CountDownDisplay({
  durationMs,
  className,
}: {
  durationMs: number;
  className: string;
}) {
  const [endTime] = useState(() => Date.now() + durationMs);
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    let frameId: number;

    const tick = () => {
      const ms = Math.max(0, endTime - Date.now());
      setRemaining(ms);

      if (ms > 0) {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => cancelAnimationFrame(frameId);
  }, [endTime]);

  return <span className={className}>{(remaining / 1000).toFixed(1)}</span>;
}
