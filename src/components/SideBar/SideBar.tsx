import Link from "next/link"

export default function SideBar(){
    return(
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
            
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-neutral-800 bg-neutral-950 p-5 text-white">
      <h1 className="mb-8 text-2xl font-bold text-green-500">
        Ginkle
      </h1>

      <nav className="flex flex-col gap-2">
        <Link
          href="/"
          className="rounded-lg px-4 py-3 hover:bg-neutral-800"
        >
          Início
        </Link>

        <Link
          href="/casas-de-repouso"
          className="rounded-lg px-4 py-3 hover:bg-neutral-800"
        >
          Casas de repouso
        </Link>

        <Link
          href="/sobre"
          className="rounded-lg px-4 py-3 hover:bg-neutral-800"
        >
          Sobre nós
        </Link>

        <Link
          href="/perfil"
          className="rounded-lg px-4 py-3 hover:bg-neutral-800"
        >
          Meu perfil
        </Link>
      </nav>

      <div className="mt-auto">
        <Link
          href="/login"
          className="block rounded-lg px-4 py-3 text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          Sair
        </Link>
      </div>
    </aside>

        </main>
    )
}