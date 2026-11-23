import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Calendar, LogOut } from "lucide-react";
import { sair } from "@/app/(auth)/actions";
import AvatarUpload from "@/components/painel/AvatarUpload";
import { AlterarSenhaForm, PerfilDadosForm } from "@/components/painel/PerfilGestorForms";
import { perfilDoGestor } from "@/lib/painel/dados";
import { chaveDia, dataCurta, rotuloCargo } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilFuncionarioPage() {
  const perfil = await perfilDoGestor();
  if (!perfil) redirect("/login?next=/funcionario/perfil");

  const hojeIso = chaveDia(new Date());
  const ehGestor = perfil.vinculos.some((v) => v.cargo === "GESTOR");

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold sm:text-3xl">{perfil.nome}</h1>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
              {ehGestor ? "Equipe · Gestor" : "Funcionário"}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            <span className="break-all">{perfil.email}</span>
            {perfil.criadoEm ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  Conta desde {dataCurta(perfil.criadoEm)}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <AvatarUpload
          usuarioId={perfil.id}
          nome={perfil.nome}
          avatarUrl={perfil.avatarUrl}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PerfilDadosForm
            nome={perfil.nome}
            email={perfil.email}
            cpf={perfil.cpf}
            telefone={perfil.telefone}
            dataNascimento={perfil.dataNascimento}
            hojeIso={hojeIso}
          />

          <AlterarSenhaForm email={perfil.email} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold">Casas vinculadas</h2>

            {perfil.vinculos.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Você não possui vínculos ativos no momento.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {perfil.vinculos.map((v) => (
                  <li key={v.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Building2
                            className="size-3.5 shrink-0 text-brand-strong"
                            aria-hidden="true"
                          />
                          <span className="truncate">{v.casaNome}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {v.cidade} · {v.uf} · {rotuloCargo(v.cargo)}
                        </p>
                      </div>

                      {v.cargo === "GESTOR" ? (
                        <Link
                          href={`/gerente/casas/${v.casaId}`}
                          aria-label={`Abrir ${v.casaNome} no painel do gestor`}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-brand-strong"
                        >
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-base font-semibold">Sessão</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Encerre sua sessão neste navegador ao finalizar o turno.
            </p>
            <form action={sair} className="mt-4">
              <button
                type="submit"
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sair da conta
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
