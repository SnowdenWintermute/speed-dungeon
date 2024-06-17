export default function splitHpChangeWithMultiTargetBonus(
  hpChangeValue: number,
  numTargets: number,
  bonus: number
): number {
  const multiTargetBonus = 1.0 + (numTargets - 1.0) * bonus;
  const valueWithBonus = hpChangeValue + multiTargetBonus;
  return valueWithBonus / numTargets;
}
