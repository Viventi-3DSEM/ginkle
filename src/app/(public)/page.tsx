import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (

<section className="grid min-h-[600px] grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 md:px-12 lg:px-16">

        <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Gink<span className="text-green-400">le</span>

 </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          Busque, compare e descubra as melhores opções de instituições de cuidado para seu ente-querido!
    </p>

        <Link
    href="/sobre"
          className="mt-8 inline-flex items-center gap-3 rounded-[5px] bg-green-400 px-6 py-3.5 font-bold text-foreground transition hover:bg-green-300"
      >
          Saiba Mais
        </Link>
      </div>

      
     <div className="relative min-h-[350px] max-h-130">
    <Image
      src="/images/velhos.jpg"
      alt="velhos"
      fill
        sizes="(width: 100%)"
      className="object-cover"
          priority
/>
        </div>
        
        <div className="flex flex-col items-center col-span-2 mt-8">
          <Link href="/home-cliente"
          className="text-green-400 hover:text-white"
          >Home Page Cliente</Link>
          
          <Link href="/home-funcionario"
          className="text-green-400 hover:text-white"
          >Home Page Funcionário</Link>
          
          <Link href="/gerente/home-gerente"
          className="text-green-400 hover:text-white"
          >Home Page Dono de ILPI</Link>
        </div>

    </section>
    
  );
}