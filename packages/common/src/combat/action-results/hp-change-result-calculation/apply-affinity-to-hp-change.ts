export default function applyAffinityToHpChange(
  affinityPercentage: number,
  hpChange: number
): number {
  let multiplier = 1;
  if (affinityPercentage < 0) {
    multiplier = (affinityPercentage * -1) / 100;
  } else if (affinityPercentage > 0 && affinityPercentage <= 100) {
    multiplier = 1 - affinityPercentage / 100;
  } else if (affinityPercentage > 100) {
    const capped = Math.min(200, affinityPercentage);
    multiplier = ((capped - 100) / 100) * -1;
  }

  return hpChange * multiplier;
}
