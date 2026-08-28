interface Props {
  split: { fromGear: number; allocated: number; inherent: number };
}

/**
 * Where an attribute came from, beside the total it attributes. These are unfloored and the total
 * beside them is not, so they sum to a hair over it — read them as shares, not as the total's parts.
 */
export function AttributeSourceSplit({ split }: Props) {
  return (
    <span className="whitespace-nowrap">
      {Math.round(split.fromGear)}
      <span className="text-theme-muted"> / </span>
      {Math.round(split.allocated)}
      <span className="text-theme-muted"> / </span>
      {Math.round(split.inherent)}
    </span>
  );
}
