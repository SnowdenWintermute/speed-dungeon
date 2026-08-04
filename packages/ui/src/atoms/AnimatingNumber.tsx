function AnimatedDigit({ value }: { value: number }) {
  return (
    <span key={value} className="inline-block animate-slide-appear-from-top">
      {value}
    </span>
  );
}

export function AnimatingNumber({ value }: { value: number }) {
  const digits = value.toString().split("");

  return (
    <div className="flex">
      {digits.map((digit, index) => (
        <AnimatedDigit key={`${digit}-${index}`} value={Number(digit)} />
      ))}
    </div>
  );
}
