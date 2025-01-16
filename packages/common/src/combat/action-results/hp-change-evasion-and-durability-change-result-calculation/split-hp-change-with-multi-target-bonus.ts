export default function splitHpChangeWithMultiTargetBonus(
  hpChangeValue: number,
  numTargets: number,
  bonus: number
): number {
  const multiTargetBonus = 1 + (numTargets - 1) * bonus;
  const valueWithBonus = hpChangeValue * multiTargetBonus;
  return valueWithBonus / numTargets;
}
