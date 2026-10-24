import Link from "next/link";

type Ilpi = {
  id: string;
  nome: string;
};

const ilpis: Ilpi[] = [
  { id: "1", nome: "ILPI Vida Plena" },
  { id: "2", nome: "ILPI Recanto Feliz" },
  { id: "3", nome: "ILPI Casa do Sol" },
  { id: "4", nome: "ILPI Bom Viver" },
  { id: "5", nome: "ILPI Jardim das Flores" },
  { id: "6", nome: "ILPI Novo Horizonte" },
  { id: "7", nome: "ILPI Cantinho Sereno" },
];

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a3.2 3.2 0 1 1 0 6.4A3.2 3.2 0 0 1 12 6Zm0 14.2a8 8 0 0 1-6-2.7c.05-2 4-3.1 6-3.1s5.95 1.1 6 3.1a8 8 0 0 1-6 2.7Z" />
    </svg>
  );
}

function Header() {
  return (
    <header className="border-b border-white/10 bg-[#090909]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-white"
        >
          Gink<span className="text-green-400">le</span>
        </Link>

       <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notificações"
          className="rounded-full p-1 transition hover:bg-white/15 focus-visible:outline 
          focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
        >
          <BellIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Perfil"
          className="rounded-full transition hover:bg-white/15 focus-visible:outline 
          focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
        >
          <UserIcon className="h-6 w-6" />
        </button>
        </div>
      </nav>
    </header>
  );
}



function IlpiCard({ ilpi }: { ilpi: Ilpi }) {
  return (
    <li className="shrink-0 snap-start">
      <Link
        href={`/ilpi/${ilpi.id}`}
        className="flex h-40 w-40 items-end rounded-sm border border-[#3f4c57] bg-[#2e3a46] p-3 text-sm font-medium text-white/90 transition hover:border-[#6fb184] hover:bg-[#364451] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6fb184] sm:h-48 sm:w-48"
      >
        {ilpi.nome}
      </Link>
    </li>
  );
}

export default function HomeDonoIlpiPage() {
  return (
    <div className="min-h-screen bg-[#03291f] text-white">
      <Header />

      <div className="bg-[#3f7d52] px-4 py-3">
        <h1 className="text-sm font-bold">Minhas ILPI</h1>
      </div>

      <main className="py-8">
        <ul
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-color:#3f7d52_transparent] [scrollbar-width:thin]"
          aria-label="Lista de ILPI"
        >
          {ilpis.map((ilpi) => (
            <IlpiCard key={ilpi.id} ilpi={ilpi} />
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-4 px-4">
          <div className="h-px flex-1 bg-white/25" />
          <Link
            href="/ilpi/nova"
            className="rounded-sm bg-[#e9ecee] px-4 py-2 text-xs font-semibold text-[#03291f] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6fb184]"
          >
            + Nova ILPI
          </Link>
        </div>
      </main>
    </div>
  );
}