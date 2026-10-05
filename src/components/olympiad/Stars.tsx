/** Three stars, filled up to n. */
export function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span aria-label={`${n} of ${of} stars`} className="tracking-tight whitespace-nowrap">
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < n ? "text-ochre-300" : "text-faint"}>
          ★
        </span>
      ))}
    </span>
  );
}
