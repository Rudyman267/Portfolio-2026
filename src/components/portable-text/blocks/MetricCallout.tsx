export function MetricCallout({
  value,
}: {
  value: {
    value?: string | null;
    label?: string | null;
    description?: string | null;
  };
}) {
  if (!value?.value) return null;
  return (
    <div className="my-10 rounded-[var(--radius-lg)] border border-border bg-surface-2 p-8">
      <div className="text-[var(--step-5)] font-semibold tracking-tight text-accent">
        {value.value}
      </div>
      <div className="mt-1 text-[var(--step-1)] font-medium">{value.label}</div>
      {value.description && (
        <p className="mt-2 max-w-prose text-muted">{value.description}</p>
      )}
    </div>
  );
}
