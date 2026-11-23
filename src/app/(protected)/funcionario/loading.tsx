export default function FuncionarioLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando painel do turno">
      <div className="space-y-2.5">
        <div className="h-8 w-56 animate-pulse rounded-sm bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-sm bg-muted/80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-sm border border-border bg-card p-5">
            <div className="h-3 w-24 animate-pulse rounded-sm bg-muted" />
            <div className="mt-4 h-7 w-16 animate-pulse rounded-sm bg-muted" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded-sm bg-muted/70" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-sm border border-border bg-card p-5">
            <div className="h-4 w-48 animate-pulse rounded-sm bg-muted" />
            <div className="mt-3 h-3 w-full max-w-md animate-pulse rounded-sm bg-muted/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
