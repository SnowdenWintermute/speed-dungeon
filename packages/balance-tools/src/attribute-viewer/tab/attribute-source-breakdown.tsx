import { AttributeSourceContributions } from "../chased-attribute-meter";

function formatContribution(value: number) {
  return Number.isInteger(value) ? value : value.toFixed(1);
}

export function AttributeSourceBreakdown(props: { contributions: AttributeSourceContributions }) {
  const { inherent, allocated, equipment } = props.contributions;
  const sources = [
    { label: "from gear", value: equipment },
    { label: "from allocated points", value: allocated },
    { label: "from inherent attributes", value: inherent },
  ];

  return (
    <div className="flex gap-8">
      {sources.map(({ label, value }) => (
        <div key={label}>
          <span className="block text-sm text-theme-muted">{label}</span>
          <span className="block text-2xl">{formatContribution(value)}</span>
        </div>
      ))}
    </div>
  );
}
