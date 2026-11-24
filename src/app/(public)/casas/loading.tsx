export default function CasasLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10 md:py-14"
      aria-busy="true"
      aria-label="Carregando casas"
    >
      <div className="space-y-3">
        <div className="h-9 w-64 animate-pulse rounded-sm bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-sm bg-muted/80" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="overflow-hidden rounded-sm border border-border bg-card">
            <div className="aspect-[16/10] w-full animate-pulse bg-muted" />
            <div className="space-y-2.5 p-5">
              <div className="h-5 w-44 animate-pulse rounded-sm bg-muted" />
              <div className="h-3.5 w-32 animate-pulse rounded-sm bg-muted/70" />
              <div className="h-3.5 w-full animate-pulse rounded-sm bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
