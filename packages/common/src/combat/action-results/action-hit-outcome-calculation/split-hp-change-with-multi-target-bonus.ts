export function splitResourceChangeWithMultiTargetBonus(
  hpChangeValue: number,
  targetsCount: number,
  bonus: number
): number {
  const multiTargetBonus = 1 + (targetsCount - 1) * bonus;
  console.log("multiTargetBonus:", multiTargetBonus);
  const valueWithBonus = hpChangeValue * multiTargetBonus;
  console.log("value with bonus:", valueWithBonus);
  const dividedByTargetsCount = valueWithBonus / targetsCount;
  console.log("targetsCount:", targetsCount);
  console.log("dividedByTargetsCount:", dividedByTargetsCount);

  return dividedByTargetsCount;
}
