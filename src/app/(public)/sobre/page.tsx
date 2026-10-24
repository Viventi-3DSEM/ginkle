
import Image from "next/image";
import Link from "next/link";

export default function Sobre() {
  return (
    <main className="min-h-screen bg-background text-foreground" >

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-4xl text-green-400">Sobre nós</p>

          <h1 className="mt-4 text-7xl font-bold sm:text-5xl">
            Conheça o Ginkle
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            O Ginkle é um sistema desenvolvido com o objetivo de facilitar o gerenciamento de 
            Instituições de Longa Permanência para Idosos (ILPIs), também conhecidas
             como casas de repouso. A plataforma centraliza informações e oferece diferentes 
             funcionalidades de acordo com três níveis de acesso: clientes, que podem cadastrar
              os idosos; proprietários, que gerenciam suas instituições e funcionários; 
              e funcionários, que utilizam o sistema para auxiliar na organização e nas atividades
               do dia a dia. Dessa forma, o Ginkle busca tornar a administração das instituições
                mais prática, organizada e acessível.</p>
        </div>

        <div className="mt-12 grid items-center gap-10 md:grid-cols-2">
          <div className="relative min-h-[280px] overflow-hidden sm:min-h-[360px] order-2">
            <Image
              src="/images/velhos.jpg"
              alt="Representação de uma casa"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold order-1">
              Nossa proposta
            </h2>

            <p className="mt-4 leading-relaxed text-zinc-400">
             O Ginkle surgiu da preocupação do grupo com os casos de negligência
              e maus-tratos contra idosos, além das dificuldades enfrentadas pelas 
              famílias ao buscar instituições confiáveis para seus entes queridos. 
              Acreditamos que o acesso à informação e uma gestão mais organizada são
               fundamentais para promover maior transparência e confiança nesse 
               processo. Por isso, nossa proposta é oferecer uma ferramenta que 
               facilite a administração das ILPIs e aproxime famílias e instituições, 
               contribuindo para escolhas mais conscientes e para um ambiente de cuidado 
               mais seguro e responsável.
            </p>
          </div>
        </div>

        <div className="grid items-center gap-7 md:grid-cols-4 mt-8">
          <div className="order-2 col-span-1 mt-4">
            <h2 className="text-2xl font-semibold">
              Nosso time
            </h2>

            <p className="mt-4 text-zinc-400">
              O Ginkle foi desenvolvido por um grupo de 5 estudantes de Desenvolvimento de Sistemas
              da ETEC de Praia Grande.
            </p>
          </div>

          <div className=" mt-4 grid col-span-3 relative order-2 min-h-[280px] overflow-hidden sm:min-h-[360px] md:order-2">
            <div className="grid gap-3 mt-4 md:grid-cols-5">
               
              <div className="max-w-sm bg-foreground text-background rounded">
                <div className="relative w-full h-40">
                  <Image
                  alt="kaique"
                  src="/images/kaique.jpg"
                  sizes="(max-width: 768px), 100vw, 50vw"
                  fill
                  className="object-cover rounded"/>
                </div>
                <div className="px-4 py-1 font-semibold">
                  <h2>Kaique Baccas</h2>
                </div>
                <div className="px-5 py-2 font-sm">
                  <p>Desenvolvedor Back-End</p>
                </div>
              </div>

               <div className="max-w-sm bg-foreground text-background rounded">
                <div className="relative w-full h-40">
                  <Image
                  alt="kaique"
                  src="/images/kauan.jpg"
                  sizes="(max-width: 768px), 100vw, 50vw"
                  fill
                  className="object-cover rounded"/>
                </div>
                <div className="px-4 py-1">
                  <h2>Kauan Lima</h2>
                </div>
                <div className="px-5 py-2">
                  <p>Desenvolvedor Front-End</p>
                </div>
              </div>

               <div className="max-w-sm bg-foreground text-background rounded">
                <div className="relative w-full h-40">
                  <Image
                  alt="kaique"
                  src="/images/murillo.jpg"
                  sizes="(max-width: 768px), 100vw, 50vw"
                  fill
                  className="object-cover rounded"/>
                </div>
                <div className="px-4 py-1">
                  <h2>Murillo de Freitas</h2>
                </div>
                <div className="px-5 py-2">
                  <p>Desenvolvedor Back-End</p>
                </div>
              </div>

               <div className="max-w-sm bg-foreground text-background rounded">
                <div className="relative w-full h-40">
                  <Image
                  alt="kaique"
                  src="/images/isabela.jpg"
                  sizes="(max-width: 768px), 100vw, 50vw"
                  fill
                  className="object-cover rounded"/>
                </div>
                <div className="px-4 py-1">
                  <h2>Isabela Santos</h2>
                </div>
                <div className="px-5 py-2">
                  <p>Desenvolvedora Front-End</p>
                </div>
              </div>

               <div className="max-w-sm bg-foreground text-background rounded">
                <div className="relative w-full h-40">
                  <Image
                  alt="kaique"
                  src="/images/olavio.jpg"
                  sizes="(max-width: 768px), 100vw, 50vw"
                  fill
                  className="object-cover rounded"/>
                </div>
                <div className="px-4 py-1">
                  <h2>Olavio de Almeida</h2>
                </div>
                <div className="px-5 py-2">
                  <p>Desenvolvedor Back-End</p>
                </div>
              </div>

              </div>
          </div>
        </div>

        <div className="mt-16 rounded-xl bg-[#19231d] p-8 sm:p-10">
          <h2 className="text-2xl font-semibold">
            É dono de uma instituição de cuidado? Faça parte do Ginkle!
          </h2>

          <p className="mt-4 max-w-2xl leading-relaxed text-zinc-400">
            Se voce quise voce pode coloca sua casa de repouso ai e ter mais credibilização nerrr rs bora
          </p>

          <Link
            href="/cadastro"
            className="mt-6 inline-block rounded-lg bg-green-500 px-6 py-3 font-semibold text-black transition hover:bg-green-400"
          >
            Cadastre-se
          </Link>
        </div>
      </section>
    </main>
  );
}
