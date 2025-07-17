export function splitResourceChangeWithMultiTargetBonus(
  hpChangeValue: number,
  targetsCount: number,
  bonus: number
): number {
  const multiTargetBonus = 1 + (targetsCount - 1) * bonus;
  const valueWithBonus = hpChangeValue * multiTargetBonus;
  const dividedByTargetsCount = valueWithBonus / targetsCount;

  return dividedByTargetsCount;
}
