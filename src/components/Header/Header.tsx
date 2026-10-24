import Link from "next/link";


export default function Header(){
    return(        

    <header className="border-b border-white/10 bg-[#090909]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-white"
        >
          Gink<span className="text-green-400">le</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-white transition hover:text-green-400"
          >
            Login
          </Link>

          <Link
            href="/cadastro"
            className="rounded-[5px] bg-green-400 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-green-300"
          >
            Cadastre-se
          </Link>
        </div>
      </nav>
    </header>
  )
}