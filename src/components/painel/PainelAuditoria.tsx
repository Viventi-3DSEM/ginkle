"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  History,
  Lock,
  Pill,
  Search,
  ShieldCheck,
  Tag,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AcaoAuditoria, RegistroAuditoria } from "@/lib/painel/dados";
import {
  chaveDia,
  dataHora,
  dataHoraSegundos,
  horaCurta,
  rotuloCargo,
  rotuloDia,
  rotuloTipo,
} from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

type CasaResumo = {
  id: string;
  nome: string;
  slug: string;
};

type Props = {
  casas: CasaResumo[];
  registros: RegistroAuditoria[];
  acoes: AcaoAuditoria[];
  casaInicialId?: string;
  registrosLimitados?: boolean;
  acoesLimitadas?: boolean;
  diaHoje: string;
};

type Aba = "cuidados" | "acoes";
type FiltroTipoCuidado = "TODOS" | "CUIDADO" | "MEDICAMENTO" | "SINAL_VITAL" | "OCORRENCIA";
type FiltroAreaAcao = "TODAS" | "CASA" | "RESIDENTES" | "EQUIPE" | "PLANOS" | "FINANCEIRO";

const FILTROS_CUIDADO: { valor: FiltroTipoCuidado; rotulo: string }[] = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "CUIDADO", rotulo: "Cuidados" },
  { valor: "MEDICAMENTO", rotulo: "Medicamentos" },
  { valor: "SINAL_VITAL", rotulo: "Sinais vitais" },
  { valor: "OCORRENCIA", rotulo: "Ocorrências" },
];

const ESTILO_TIPO_CUIDADO: Record<string, { ponto: string; selo: string; Icone: LucideIcon }> = {
  CUIDADO: {
    ponto: "bg-brand-strong",
    selo: "bg-secondary text-brand-strong",
    Icone: ClipboardCheck,
  },
  MEDICAMENTO: {
    ponto: "bg-info",
    selo: "bg-info/15 text-info",
    Icone: Pill,
  },
  SINAL_VITAL: {
    ponto: "bg-success",
    selo: "bg-success/15 text-success",
    Icone: Activity,
  },
  OCORRENCIA: {
    ponto: "bg-warning",
    selo: "bg-warning/15 text-warning",
    Icone: AlertTriangle,
  },
};

const FILTROS_AREA: { valor: FiltroAreaAcao; rotulo: string }[] = [
  { valor: "TODAS", rotulo: "Todas" },
  { valor: "CASA", rotulo: "Casa" },
  { valor: "RESIDENTES", rotulo: "Residentes" },
  { valor: "EQUIPE", rotulo: "Equipe" },
  { valor: "PLANOS", rotulo: "Planos" },
  { valor: "FINANCEIRO", rotulo: "Financeiro" },
];

const AREA_POR_ENTIDADE: Record<
  string,
  { area: Exclude<FiltroAreaAcao, "TODAS">; rotulo: string; ponto: string; selo: string; Icone: LucideIcon }
> = {
  ilpi: {
    area: "CASA",
    rotulo: "Casa",
    ponto: "bg-brand-strong",
    selo: "bg-secondary text-brand-strong",
    Icone: Building2,
  },
  residente: {
    area: "RESIDENTES",
    rotulo: "Residentes",
    ponto: "bg-info",
    selo: "bg-info/15 text-info",
    Icone: Users,
  },
  familiar_residente: {
    area: "RESIDENTES",
    rotulo: "Residentes",
    ponto: "bg-info",
    selo: "bg-info/15 text-info",
    Icone: Users,
  },
  adesao_ilpi: {
    area: "RESIDENTES",
    rotulo: "Residentes",
    ponto: "bg-info",
    selo: "bg-info/15 text-info",
    Icone: Users,
  },
  vinculo_ilpi: {
    area: "EQUIPE",
    rotulo: "Equipe",
    ponto: "bg-success",
    selo: "bg-success/15 text-success",
    Icone: UserCog,
  },
  plano: {
    area: "PLANOS",
    rotulo: "Planos",
    ponto: "bg-brand-strong",
    selo: "bg-brand-soft text-brand-strong",
    Icone: Tag,
  },
  assinatura: {
    area: "FINANCEIRO",
    rotulo: "Financeiro",
    ponto: "bg-warning",
    selo: "bg-warning/15 text-warning",
    Icone: Wallet,
  },
  faturamento: {
    area: "FINANCEIRO",
    rotulo: "Financeiro",
    ponto: "bg-warning",
    selo: "bg-warning/15 text-warning",
    Icone: Wallet,
  },
};

const TITULO_ACAO: Record<string, string> = {
  ILPI_CRIADA: "Instituição cadastrada",
  ILPI_PUBLICADA: "Casa publicada no diretório",
  ILPI_PRIVADA: "Casa definida como privada",
  ILPI_ATUALIZADA: "Dados da casa atualizados",
  PLANO_CRIADO: "Plano criado",
  PLANO_ATIVADO: "Plano ativado",
  PLANO_DESATIVADO: "Plano desativado",
  PLANO_ATUALIZADO: "Plano atualizado",
  PLANO_EXCLUIDO: "Plano removido",
  RESIDENTE_CADASTRADO: "Residente cadastrado",
  RESIDENTE_STATUS: "Situação de residente alterada",
  RESIDENTE_ATUALIZADO: "Ficha de residente atualizada",
  EQUIPE_ADICIONADA: "Profissional adicionado à equipe",
  EQUIPE_ATIVADA: "Acesso de profissional ativado",
  EQUIPE_DESATIVADA: "Acesso de profissional desativado",
  EQUIPE_CARGO_ALTERADO: "Cargo na equipe alterado",
  EQUIPE_REMOVIDA: "Profissional removido da equipe",
  FAMILIAR_VINCULADO: "Familiar vinculado ao residente",
  FAMILIAR_ATUALIZADO: "Vínculo familiar atualizado",
  FAMILIAR_REMOVIDO: "Vínculo familiar removido",
  ADESAO_APROVADA: "Solicitação de entrada aprovada",
  ADESAO_RECUSADA: "Solicitação de entrada recusada",
  ADESAO_CANCELADA: "Solicitação de entrada cancelada",
  ASSINATURA_CRIADA: "Assinatura criada",
  ASSINATURA_ATUALIZADA: "Assinatura atualizada",
  FATURA_CRIADA: "Fatura lançada",
  FATURA_STATUS: "Situação de fatura alterada",
  FATURA_ATUALIZADA: "Fatura atualizada",
};

const ENUMS_LEGIVEIS: Record<string, string> = {
  FUNCIONARIO: "Funcionário",
  GESTOR: "Gestor",
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  ALTA: "Alta",
  OBITO: "Óbito",
  ATIVA: "Ativa",
  SUSPENSA: "Suspensa",
  CANCELADA: "Cancelada",
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ATRASADO: "Atrasado",
  CANCELADO: "Cancelado",
};

function limparDetalhes(texto: string | null): string {
  if (!texto) return "";
  return texto.replace(
    /\b(FUNCIONARIO|GESTOR|ATIVO|INATIVO|ALTA|OBITO|ATIVA|SUSPENSA|CANCELADA|PENDENTE|PAGO|ATRASADO|CANCELADO)\b/g,
    (m) => ENUMS_LEGIVEIS[m] ?? m,
  );
}

function codigoCurto(id: string): string {
  return `#${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function escaparCsv(valor: string): string {
  const limpo = valor.replace(/[\r\n]+/g, " ");
  // Neutraliza injeção de fórmula em planilhas (Excel/LibreOffice) quando a célula começa por =, +, - ou @.
  const seguro = /^[ \t]*[=+\-@]/.test(limpo) ? `'${limpo}` : limpo;
  if (/[;"\t]/.test(seguro)) {
    return `"${seguro.replace(/"/g, '""')}"`;
  }
  return seguro;
}

function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: string[][]) {
  const conteudo = [cabecalho, ...linhas]
    .map((cols) => cols.map(escaparCsv).join(";"))
    .join("\r\n");
  // BOM UTF-8 garante abertura com acentos corretos no Excel em português.
  const blob = new Blob(["\uFEFF", conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Stat({
  rotulo,
  valor,
  detalhe,
  Icone,
  destaque,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  Icone: LucideIcon;
  destaque?: "padrao" | "aviso" | "sucesso";
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {rotulo}
        </p>
        <Icone
          className={cn(
            "size-4 shrink-0",
            destaque === "aviso"
              ? "text-warning"
              : destaque === "sucesso"
                ? "text-success"
                : "text-brand-strong",
          )}
          aria-hidden="true"
        />
      </div>
      <p
        className={cn(
          "mt-3 font-heading text-2xl font-semibold leading-none",
          destaque === "aviso" ? "text-warning" : destaque === "sucesso" ? "text-success" : "",
        )}
      >
        {valor}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

export default function PainelAuditoria({
  casas,
  registros,
  acoes,
  casaInicialId,
  registrosLimitados = false,
  acoesLimitadas = false,
  diaHoje,
}: Props) {
  const casaValidaInicial =
    casaInicialId && casas.some((c) => c.id === casaInicialId) ? casaInicialId : "TODAS";
  const [filtroCasa, setFiltroCasa] = useState<string>(
    casas.length === 1 ? casas[0].id : casaValidaInicial,
  );
  const [abaAtiva, setAbaAtiva] = useState<Aba>("cuidados");

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoCuidado>("TODOS");
  const [somenteAtrasados, setSomenteAtrasados] = useState(false);
  const [buscaCuidados, setBuscaCuidados] = useState("");

  const [filtroArea, setFiltroArea] = useState<FiltroAreaAcao>("TODAS");
  const [buscaAcoes, setBuscaAcoes] = useState("");
  const [avisoExport, setAvisoExport] = useState("");

  const baseId = useId();
  const tabCuidadosRef = useRef<HTMLButtonElement>(null);
  const tabAcoesRef = useRef<HTMLButtonElement>(null);
  const painelCuidadosRef = useRef<HTMLDivElement>(null);
  const painelAcoesRef = useRef<HTMLDivElement>(null);

  // Sincroniza hidden="until-found" e reage ao find-in-page (beforematch) conforme guia de tabs.
  useEffect(() => {
    const pCuidados = painelCuidadosRef.current;
    const pAcoes = painelAcoesRef.current;
    if (!pCuidados || !pAcoes) return;

    if (abaAtiva === "cuidados") {
      pCuidados.removeAttribute("hidden");
      pAcoes.setAttribute("hidden", "until-found");
    } else {
      pAcoes.removeAttribute("hidden");
      pCuidados.setAttribute("hidden", "until-found");
    }
  }, [abaAtiva]);

  useEffect(() => {
    const pCuidados = painelCuidadosRef.current;
    const pAcoes = painelAcoesRef.current;
    if (!pCuidados || !pAcoes) return;

    const onMatchCuidados = () => setAbaAtiva("cuidados");
    const onMatchAcoes = () => setAbaAtiva("acoes");
    pCuidados.addEventListener("beforematch", onMatchCuidados);
    pAcoes.addEventListener("beforematch", onMatchAcoes);
    return () => {
      pCuidados.removeEventListener("beforematch", onMatchCuidados);
      pAcoes.removeEventListener("beforematch", onMatchAcoes);
    };
  }, []);

  const registrosCasa = useMemo(
    () =>
      filtroCasa === "TODAS" ? registros : registros.filter((r) => r.casaId === filtroCasa),
    [registros, filtroCasa],
  );

  const acoesCasa = useMemo(
    () => (filtroCasa === "TODAS" ? acoes : acoes.filter((a) => a.casaId === filtroCasa)),
    [acoes, filtroCasa],
  );

  const totalAtrasadosCasa = useMemo(
    () => registrosCasa.filter((r) => r.atrasado).length,
    [registrosCasa],
  );

  const pontualidadePct = useMemo(() => {
    if (registrosCasa.length === 0) return null;
    const noPrazo = registrosCasa.length - totalAtrasadosCasa;
    return Math.round((noPrazo / registrosCasa.length) * 100);
  }, [registrosCasa.length, totalAtrasadosCasa]);

  const contagemPorTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const r of registrosCasa) {
      mapa.set(r.tipo, (mapa.get(r.tipo) ?? 0) + 1);
    }
    return mapa;
  }, [registrosCasa]);

  const cuidadosVisiveis = useMemo(() => {
    const termo = buscaCuidados.trim().toLowerCase();
    return registrosCasa.filter((r) => {
      if (filtroTipo !== "TODOS" && r.tipo !== filtroTipo) return false;
      if (somenteAtrasados && !r.atrasado) return false;
      if (
        termo &&
        !r.titulo.toLowerCase().includes(termo) &&
        !r.descricao.toLowerCase().includes(termo) &&
        !r.residenteNome.toLowerCase().includes(termo) &&
        !r.autorNome.toLowerCase().includes(termo) &&
        !r.casaNome.toLowerCase().includes(termo)
      ) {
        return false;
      }
      return true;
    });
  }, [registrosCasa, filtroTipo, somenteAtrasados, buscaCuidados]);

  const gruposCuidados = useMemo(() => {
    const mapa = new Map<string, RegistroAuditoria[]>();
    for (const item of cuidadosVisiveis) {
      const dia = chaveDia(item.criadoEm);
      const lista = mapa.get(dia);
      if (lista) lista.push(item);
      else mapa.set(dia, [item]);
    }
    return [...mapa.entries()];
  }, [cuidadosVisiveis]);

  const contagemPorArea = useMemo(() => {
    const mapa = new Map<FiltroAreaAcao, number>();
    for (const a of acoesCasa) {
      const info = AREA_POR_ENTIDADE[a.entidade];
      if (info) mapa.set(info.area, (mapa.get(info.area) ?? 0) + 1);
    }
    return mapa;
  }, [acoesCasa]);

  const acoesVisiveis = useMemo(() => {
    const termo = buscaAcoes.trim().toLowerCase();
    return acoesCasa.filter((a) => {
      const area = AREA_POR_ENTIDADE[a.entidade]?.area ?? "CASA";
      if (filtroArea !== "TODAS" && area !== filtroArea) return false;
      if (termo) {
        const titulo = (TITULO_ACAO[a.acao] ?? a.acao).toLowerCase();
        const detalhes = limparDetalhes(a.detalhes).toLowerCase();
        if (
          !titulo.includes(termo) &&
          !detalhes.includes(termo) &&
          !a.autorNome.toLowerCase().includes(termo) &&
          !a.autorEmail.toLowerCase().includes(termo) &&
          !a.casaNome.toLowerCase().includes(termo)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [acoesCasa, filtroArea, buscaAcoes]);

  const gruposAcoes = useMemo(() => {
    const mapa = new Map<string, AcaoAuditoria[]>();
    for (const item of acoesVisiveis) {
      const dia = chaveDia(item.criadoEm);
      const lista = mapa.get(dia);
      if (lista) lista.push(item);
      else mapa.set(dia, [item]);
    }
    return [...mapa.entries()];
  }, [acoesVisiveis]);

  function selecionarAba(proxima: Aba, focar = false) {
    setAbaAtiva(proxima);
    const btn = proxima === "cuidados" ? tabCuidadosRef.current : tabAcoesRef.current;
    if (btn) {
      btn.scrollIntoView({ block: "nearest", inline: "nearest" });
      if (focar) btn.focus();
    }
  }

  function aoTeclarTablist(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      if (e.key === "Home") {
        selecionarAba("cuidados", true);
      } else if (e.key === "End") {
        selecionarAba("acoes", true);
      } else {
        selecionarAba(abaAtiva === "cuidados" ? "acoes" : "cuidados", true);
      }
    }
  }

  function exportarRelatorio() {
    if (abaAtiva === "cuidados") {
      if (cuidadosVisiveis.length === 0) {
        setAvisoExport("Não há registros visíveis para exportar.");
        return;
      }
      const linhas = cuidadosVisiveis.map((r) => [
        codigoCurto(r.id),
        r.casaNome,
        r.residenteNome,
        rotuloTipo(r.tipo),
        r.titulo,
        r.descricao,
        r.autorNome,
        rotuloCargo(r.autorCargo),
        dataHoraSegundos(r.criadoEm),
        dataHoraSegundos(r.sincronizadoEm),
        r.intervaloRotulo,
        r.atrasado ? "Sincronizado com atraso (>10 min)" : "Verificado no prazo",
      ]);
      baixarCsv(
        `auditoria-cuidados-${diaHoje}.csv`,
        [
          "Código",
          "Casa",
          "Residente",
          "Tipo",
          "Título",
          "Descrição",
          "Responsável",
          "Cargo",
          "Horário no aparelho",
          "Horário no servidor",
          "Diferença",
          "Integridade",
        ],
        linhas,
      );
      setAvisoExport(
        `Relatório de cuidados exportado (${cuidadosVisiveis.length} ${
          cuidadosVisiveis.length === 1 ? "registro" : "registros"
        }).`,
      );
      return;
    }

    if (acoesVisiveis.length === 0) {
      setAvisoExport("Não há ações visíveis para exportar.");
      return;
    }
    const linhas = acoesVisiveis.map((a) => [
      codigoCurto(a.id),
      a.casaNome,
      AREA_POR_ENTIDADE[a.entidade]?.rotulo ?? "Gestão",
      TITULO_ACAO[a.acao] ?? a.acao,
      limparDetalhes(a.detalhes),
      a.autorNome,
      a.autorEmail,
      dataHoraSegundos(a.criadoEm),
      dataHoraSegundos(a.sincronizadoEm),
    ]);
    baixarCsv(
      `auditoria-gestao-${diaHoje}.csv`,
      [
        "Código",
        "Casa",
        "Área",
        "Ação",
        "Detalhes",
        "Responsável",
        "E-mail",
        "Horário no aparelho",
        "Horário no servidor",
      ],
      linhas,
    );
    setAvisoExport(
      `Relatório da gestão exportado (${acoesVisiveis.length} ${
        acoesVisiveis.length === 1 ? "ação" : "ações"
      }).`,
    );
  }

  const mostrarCasa = filtroCasa === "TODAS" && casas.length > 1;
  const totalExportavel =
    abaAtiva === "cuidados" ? cuidadosVisiveis.length : acoesVisiveis.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {casas.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar auditoria por casa">
            <button
              type="button"
              aria-pressed={filtroCasa === "TODAS"}
              onClick={() => setFiltroCasa("TODAS")}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                filtroCasa === "TODAS"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>Todas as casas</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                  filtroCasa === "TODAS"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {registros.length + acoes.length}
              </span>
            </button>

            {casas.map((casa) => {
              const qtd =
                registros.filter((r) => r.casaId === casa.id).length +
                acoes.filter((a) => a.casaId === casa.id).length;
              const ativo = filtroCasa === casa.id;
              return (
                <button
                  key={casa.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setFiltroCasa(casa.id)}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span>{casa.nome}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none",
                      ativo ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {qtd}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={exportarRelatorio}
          disabled={totalExportavel === 0}
          className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4 text-brand-strong" aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      {avisoExport ? (
        <p
          role="status"
          className="flex items-start gap-2 border-l-2 border-success bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <span>{avisoExport}</span>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          rotulo="Pontualidade"
          valor={pontualidadePct === null ? "—" : `${pontualidadePct}%`}
          detalhe={
            registrosCasa.length === 0
              ? "Sem registros de cuidados ainda"
              : `${registrosCasa.length - totalAtrasadosCasa} de ${registrosCasa.length} no prazo`
          }
          Icone={ShieldCheck}
          destaque={
            pontualidadePct === null ? "padrao" : pontualidadePct >= 90 ? "sucesso" : "aviso"
          }
        />
        <Stat
          rotulo="Atrasos de envio"
          valor={String(totalAtrasadosCasa)}
          detalhe={
            totalAtrasadosCasa === 0
              ? "Nenhum atraso acima de 10 min"
              : "Acima de 10 min entre registro e envio"
          }
          Icone={AlertTriangle}
          destaque={totalAtrasadosCasa > 0 ? "aviso" : "sucesso"}
        />
        <Stat
          rotulo="Registros de cuidados"
          valor={String(registrosCasa.length)}
          detalhe="Cuidados, remédios, sinais e ocorrências"
          Icone={ClipboardCheck}
        />
        <Stat
          rotulo="Ações da gestão"
          valor={String(acoesCasa.length)}
          detalhe="Alterações gravadas automaticamente"
          Icone={History}
        />
      </div>

      <div className="flex items-center gap-2.5 rounded-sm border border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
        <Lock className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
        <p className="leading-relaxed">
          <span className="font-semibold text-foreground">Histórico imutável:</span> nem
          gestores nem funcionários conseguem editar ou apagar registros depois de salvos.
          {registrosLimitados || acoesLimitadas
            ? " A visualização exibe os 200 itens mais recentes de cada trilha."
            : ""}
        </p>
      </div>

      <div className="space-y-5">
        <div
          role="tablist"
          aria-label="Seções da auditoria"
          onKeyDown={aoTeclarTablist}
          className="flex overflow-x-auto border-b border-border"
        >
          <button
            ref={tabCuidadosRef}
            id={`${baseId}-tab-cuidados`}
            type="button"
            role="tab"
            aria-selected={abaAtiva === "cuidados"}
            tabIndex={abaAtiva === "cuidados" ? 0 : -1}
            onClick={() => selecionarAba("cuidados")}
            className={cn(
              "ginkle-tab inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              abaAtiva === "cuidados"
                ? "text-brand-strong"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            <span>Cuidados e integridade</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] leading-none text-foreground">
              {registrosCasa.length}
            </span>
          </button>

          <button
            ref={tabAcoesRef}
            id={`${baseId}-tab-acoes`}
            type="button"
            role="tab"
            aria-selected={abaAtiva === "acoes"}
            tabIndex={abaAtiva === "acoes" ? 0 : -1}
            onClick={() => selecionarAba("acoes")}
            className={cn(
              "ginkle-tab inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              abaAtiva === "acoes"
                ? "text-brand-strong"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <History className="size-4 shrink-0" aria-hidden="true" />
            <span>Ações da gestão</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] leading-none text-foreground">
              {acoesCasa.length}
            </span>
          </button>
        </div>

        {/* Sem gap entre painéis e sem estilo direto no elemento tabpanel para compatibilidade com hidden="until-found". */}
        <div>
          <div
            ref={painelCuidadosRef}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-cuidados`}
            hidden={abaAtiva !== "cuidados"}
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Filtrar cuidados por tipo"
                  >
                    {FILTROS_CUIDADO.map((op) => {
                      const qtd =
                        op.valor === "TODOS"
                          ? registrosCasa.length
                          : (contagemPorTipo.get(op.valor) ?? 0);
                      const ativo = filtroTipo === op.valor;
                      return (
                        <button
                          key={op.valor}
                          type="button"
                          aria-pressed={ativo}
                          onClick={() => setFiltroTipo(op.valor)}
                          className={cn(
                            "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                            ativo
                              ? "bg-secondary text-brand-strong"
                              : "border border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                          )}
                        >
                          <span>{op.rotulo}</span>
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.68rem] leading-none">
                            {qtd}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    aria-pressed={somenteAtrasados}
                    onClick={() => setSomenteAtrasados((v) => !v)}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                      somenteAtrasados
                        ? "bg-warning/20 text-warning"
                        : "border border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <Clock className="size-3.5" aria-hidden="true" />
                    <span>Somente com atraso</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.68rem] leading-none text-foreground">
                      {totalAtrasadosCasa}
                    </span>
                  </button>
                </div>

                <search className="relative w-full lg:max-w-xs">
                  <label htmlFor={`${baseId}-busca-cuidados`} className="sr-only">
                    Buscar por residente, profissional ou título
                  </label>
                  <Search
                    className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id={`${baseId}-busca-cuidados`}
                    type="search"
                    value={buscaCuidados}
                    onChange={(e) => setBuscaCuidados(e.target.value)}
                    placeholder="Buscar residente, profissional ou título..."
                    autoCorrect="off"
                    spellCheck={false}
                    className="min-h-10 w-full border-b border-input bg-transparent py-1.5 pl-6 pr-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm"
                  />
                </search>
              </div>

              <p aria-live="polite" className="sr-only">
                {cuidadosVisiveis.length === 1
                  ? "Mostrando 1 registro de cuidado."
                  : `Mostrando ${cuidadosVisiveis.length} registros de cuidados.`}
              </p>

              {cuidadosVisiveis.length === 0 ? (
                <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
                  <ShieldCheck className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
                  <h2 className="mt-3 font-heading text-base font-semibold">
                    {registrosCasa.length === 0
                      ? "Nenhum registro de cuidado ainda"
                      : "Nenhum registro encontrado"}
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                    {registrosCasa.length === 0
                      ? "Quando a equipe registrar cuidados, medicamentos ou ocorrências, o comparativo de horários aparecerá aqui."
                      : "Limpe a busca ou ajuste os filtros para ver outros registros."}
                  </p>
                  {registrosCasa.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroTipo("TODOS");
                        setSomenteAtrasados(false);
                        setBuscaCuidados("");
                      }}
                      className="mt-4 inline-flex min-h-9 items-center rounded-sm border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
                    >
                      Limpar filtros
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-6">
                  {gruposCuidados.map(([dia, itens]) => (
                    <section key={dia} className="space-y-3">
                      <h2 className="font-serif text-sm italic text-muted-foreground">
                        {rotuloDia(dia, diaHoje)}
                      </h2>

                      <ol className="relative space-y-3 border-l border-border pl-5">
                        {itens.map((item) => {
                          const estilo =
                            ESTILO_TIPO_CUIDADO[item.tipo] ?? ESTILO_TIPO_CUIDADO.CUIDADO;
                          const Icone = estilo.Icone;

                          return (
                            <li
                              key={item.id}
                              className={cn(
                                "relative rounded-sm border bg-card p-4 sm:p-5",
                                item.atrasado ? "border-warning/60" : "border-border",
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute -left-[25px] top-6 size-2.5 rounded-full ring-4 ring-background",
                                  item.atrasado ? "bg-warning" : estilo.ponto,
                                )}
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                                      estilo.selo,
                                    )}
                                  >
                                    <Icone className="size-3" aria-hidden="true" />
                                    {rotuloTipo(item.tipo)}
                                  </span>

                                  {item.atrasado ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-warning">
                                      <Clock className="size-3" aria-hidden="true" />
                                      Atraso de {item.intervaloRotulo}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-success">
                                      <CheckCircle2 className="size-3" aria-hidden="true" />
                                      No prazo
                                    </span>
                                  )}
                                </div>

                                <time
                                  dateTime={item.criadoEm}
                                  className="text-xs font-medium text-muted-foreground"
                                >
                                  {horaCurta(item.criadoEm)}
                                </time>
                              </div>

                              <p className="mt-2.5 text-sm font-semibold text-foreground">
                                {item.titulo}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                {item.descricao}
                              </p>

                              <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                <span>
                                  Residente:{" "}
                                  <span className="font-medium text-foreground">
                                    {item.residenteNome}
                                  </span>
                                </span>
                                {mostrarCasa ? (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{item.casaNome}</span>
                                  </>
                                ) : null}
                                <span aria-hidden="true">·</span>
                                <span>
                                  Por{" "}
                                  <span className="font-medium text-foreground">
                                    {item.autorNome}
                                  </span>
                                  {item.autorCargo ? ` (${rotuloCargo(item.autorCargo)})` : ""}
                                </span>
                              </p>

                              <div className="mt-3.5 grid gap-2 rounded-sm bg-muted/50 px-3 py-2.5 text-xs sm:grid-cols-3">
                                <div>
                                  <span className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Horário no aparelho
                                  </span>
                                  <time
                                    dateTime={item.criadoEm}
                                    className="mt-0.5 block font-medium text-foreground"
                                  >
                                    {dataHora(item.criadoEm)}
                                  </time>
                                </div>

                                <div>
                                  <span className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Recebido no servidor
                                  </span>
                                  <time
                                    dateTime={item.sincronizadoEm}
                                    className="mt-0.5 block font-medium text-foreground"
                                  >
                                    {dataHora(item.sincronizadoEm)}
                                  </time>
                                </div>

                                <div>
                                  <span className="block text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Diferença
                                  </span>
                                  <time
                                    dateTime={item.intervaloIso}
                                    className={cn(
                                      "mt-0.5 block font-medium",
                                      item.atrasado ? "text-warning" : "text-success",
                                    )}
                                  >
                                    {item.intervaloAdiantado
                                      ? `${item.intervaloRotulo} adiantado`
                                      : item.intervaloRotulo}
                                  </time>
                                </div>
                              </div>

                              <details className="ginkle-details mt-3 border-t border-border/70 pt-2.5">
                                <summary className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                                  Detalhes da verificação
                                </summary>
                                <div className="mt-2.5 space-y-2 text-xs text-muted-foreground">
                                  <p className="leading-relaxed">
                                    {item.atrasado
                                      ? "Diferença superior a 10 minutos entre o horário marcado no aparelho e o recebimento pelo servidor. Pode indicar envio após falta de internet ou lançamento feito depois do atendimento."
                                      : "Registro recebido pelo servidor dentro da tolerância de 10 minutos em relação ao horário do aparelho."}
                                  </p>
                                  <dl className="grid gap-1.5 pt-1 sm:grid-cols-2">
                                    <div>
                                      <dt className="inline text-muted-foreground">Aparelho: </dt>
                                      <dd className="inline font-medium text-foreground">
                                        {dataHoraSegundos(item.criadoEm)}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="inline text-muted-foreground">Servidor: </dt>
                                      <dd className="inline font-medium text-foreground">
                                        {dataHoraSegundos(item.sincronizadoEm)}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="inline text-muted-foreground">Referência: </dt>
                                      <dd className="inline font-mono text-foreground">
                                        {codigoCurto(item.id)}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>
                              </details>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            ref={painelAcoesRef}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-acoes`}
            hidden={abaAtiva !== "acoes"}
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Filtrar ações da gestão por área"
                >
                  {FILTROS_AREA.map((op) => {
                    const qtd =
                      op.valor === "TODAS"
                        ? acoesCasa.length
                        : (contagemPorArea.get(op.valor) ?? 0);
                    const ativo = filtroArea === op.valor;
                    return (
                      <button
                        key={op.valor}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setFiltroArea(op.valor)}
                        className={cn(
                          "inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                          ativo
                            ? "bg-secondary text-brand-strong"
                            : "border border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                        )}
                      >
                        <span>{op.rotulo}</span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.68rem] leading-none">
                          {qtd}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <search className="relative w-full lg:max-w-xs">
                  <label htmlFor={`${baseId}-busca-acoes`} className="sr-only">
                    Buscar por responsável, ação ou detalhe
                  </label>
                  <Search
                    className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id={`${baseId}-busca-acoes`}
                    type="search"
                    value={buscaAcoes}
                    onChange={(e) => setBuscaAcoes(e.target.value)}
                    placeholder="Buscar responsável, ação ou detalhe..."
                    autoCorrect="off"
                    spellCheck={false}
                    className="min-h-10 w-full border-b border-input bg-transparent py-1.5 pl-6 pr-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand-strong sm:text-sm"
                  />
                </search>
              </div>

              <p aria-live="polite" className="sr-only">
                {acoesVisiveis.length === 1
                  ? "Mostrando 1 ação administrativa."
                  : `Mostrando ${acoesVisiveis.length} ações administrativas.`}
              </p>

              {acoesVisiveis.length === 0 ? (
                <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
                  <History className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
                  <h2 className="mt-3 font-heading text-base font-semibold">
                    {acoesCasa.length === 0
                      ? "Nenhuma ação registrada ainda"
                      : "Nenhuma ação encontrada"}
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                    {acoesCasa.length === 0
                      ? "Todas as alterações em casas, planos, equipe, moradores e financeiro passam a aparecer aqui automaticamente."
                      : "Limpe a busca ou troque o filtro de área."}
                  </p>
                  {acoesCasa.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroArea("TODAS");
                        setBuscaAcoes("");
                      }}
                      className="mt-4 inline-flex min-h-9 items-center rounded-sm border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
                    >
                      Limpar filtros
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-6">
                  {gruposAcoes.map(([dia, itens]) => (
                    <section key={dia} className="space-y-3">
                      <h2 className="font-serif text-sm italic text-muted-foreground">
                        {rotuloDia(dia, diaHoje)}
                      </h2>

                      <ol className="relative space-y-3 border-l border-border pl-5">
                        {itens.map((item) => {
                          const area = AREA_POR_ENTIDADE[item.entidade] ?? AREA_POR_ENTIDADE.ilpi;
                          const Icone = area.Icone;
                          const titulo = TITULO_ACAO[item.acao] ?? item.acao;
                          const detalheTexto = limparDetalhes(item.detalhes);

                          return (
                            <li
                              key={item.id}
                              className="relative rounded-sm border border-border bg-card p-4 sm:p-5"
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute -left-[25px] top-6 size-2.5 rounded-full ring-4 ring-background",
                                  area.ponto,
                                )}
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider",
                                    area.selo,
                                  )}
                                >
                                  <Icone className="size-3" aria-hidden="true" />
                                  {area.rotulo}
                                </span>

                                <time
                                  dateTime={item.criadoEm}
                                  className="text-xs font-medium text-muted-foreground"
                                >
                                  {horaCurta(item.criadoEm)}
                                </time>
                              </div>

                              <p className="mt-2.5 text-sm font-semibold text-foreground">
                                {titulo}
                              </p>
                              {detalheTexto ? (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {detalheTexto}
                                </p>
                              ) : null}

                              <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                <span>
                                  Feito por{" "}
                                  <span className="font-medium text-foreground">
                                    {item.autorNome}
                                  </span>
                                </span>
                                {mostrarCasa ? (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{item.casaNome}</span>
                                  </>
                                ) : null}
                              </p>

                              <details className="ginkle-details mt-3 border-t border-border/70 pt-2.5">
                                <summary className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                                  Detalhes do registro
                                </summary>
                                <dl className="mt-2.5 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                                  <div>
                                    <dt className="inline">Data e hora: </dt>
                                    <dd className="inline font-medium text-foreground">
                                      {dataHoraSegundos(item.sincronizadoEm)}
                                    </dd>
                                  </div>
                                  {item.autorEmail ? (
                                    <div className="min-w-0 break-all">
                                      <dt className="inline">Conta: </dt>
                                      <dd className="inline font-medium text-foreground">
                                        {item.autorEmail}
                                      </dd>
                                    </div>
                                  ) : null}
                                  <div>
                                    <dt className="inline">Referência: </dt>
                                    <dd className="inline font-mono text-foreground">
                                      {codigoCurto(item.id)}
                                    </dd>
                                  </div>
                                </dl>
                              </details>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
