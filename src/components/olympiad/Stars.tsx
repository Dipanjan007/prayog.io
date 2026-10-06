/** Three stars, filled up to n. */
export function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span aria-label={`${n} of ${of} stars`} className="tracking-tight whitespace-nowrap">
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < n ? "text-amber-300" : "text-white/45"}>
          ★
        </span>
      ))}
    </span>
  );
}
