export function QuoteBlock({
  value,
}: {
  value: {
    text?: string | null;
    attribution?: string | null;
    role?: string | null;
  };
}) {
  if (!value?.text) return null;
  return (
    <figure className="my-12 border-l-2 border-accent pl-6">
      <blockquote className="text-[var(--step-2)] font-medium leading-snug">
        “{value.text}”
      </blockquote>
      {(value.attribution || value.role) && (
        <figcaption className="mt-4 text-[var(--step-0)] text-muted">
          {value.attribution}
          {value.role && (
            <span className="text-faint"> — {value.role}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
