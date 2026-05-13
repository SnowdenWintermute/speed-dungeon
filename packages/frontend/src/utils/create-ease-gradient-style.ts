import { Color4 } from "@babylonjs/core";

export function createEaseGradient(
  color1: Color4,
  color2: Color4,
  steps: number,
  startEaseFactor: number = 1.1, // Adjusts early easing
  endEaseFactor: number = 0.2 // Adjusts later easing
): string {
  const interpolate = (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
  };

  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    // Calculate normalized position (x)
    const x = i / steps;

    // Combined ease-in-out function
    const t = Math.pow(x, startEaseFactor) * (1 - Math.pow(1 - x, endEaseFactor));

    // Interpolate RGBA values
    const r = Math.round(interpolate(color1.r, color2.r, t));
    const g = Math.round(interpolate(color1.g, color2.g, t));
    const b = Math.round(interpolate(color1.b, color2.b, t));
    const a = interpolate(color1.a, color2.a, t).toFixed(2);

    // Add stop to the gradient
    const position = (x * 100).toFixed(2);
    stops.push(`rgba(${r}, ${g}, ${b}, ${a}) ${position}%`);
  }

  return `linear-gradient(to right, ${stops.join(", ")})`;
}
