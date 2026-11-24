"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { CalendarClock, Clock, Info, Loader2, Plus, Trash2 } from "lucide-react";
import { criarTurnoEscala, removerTurnoEscala } from "@/lib/painel/actions";
import type { MembroEquipe, TurnoEscalaGestor } from "@/lib/painel/dados";
import { dataCurta, rotuloCargo } from "@/lib/painel/formato";
import { cn } from "@/lib/utils";

const OPCOES_TURNO = [
  { valor: "MANHA", rotulo: "Manhã", inicio: "07:00", fim: "13:00" },
  { valor: "TARDE", rotulo: "Tarde", inicio: "13:00", fim: "19:00" },
  { valor: "NOITE", rotulo: "Noite", inicio: "19:00", fim: "07:00" },
  { valor: "PLANTAO_12H", rotulo: "Plantão 12h", inicio: "07:00", fim: "19:00" },
  { valor: "INTEGRAL", rotulo: "Integral", inicio: "08:00", fim: "17:00" },
] as const;

const ROTULO_TURNO = new Map<string, string>(OPCOES_TURNO.map((o) => [o.valor, o.rotulo]));

const inputClass =
  "w-full border-b border-input bg-transparent py-2 text-base text-foreground outline-none transition-colors focus:border-brand-strong sm:text-sm";
const labelClass =
  "block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export default function GerenciadorEscalaGestor({
  casas,
  membros,
  turnos,
  disponivel,
  hojeIso,
}: {
  casas: { id: string; nome: string }[];
  membros: MembroEquipe[];
  turnos: TurnoEscalaGestor[];
  disponivel: boolean;
  hojeIso: string;
}) {
  const baseId = useId();
  const ativos = useMemo(() => membros.filter((m) => m.ativo), [membros]);

  const [vinculoId, setVinculoId] = useState(ativos[0]?.id ?? "");
  const [data, setData] = useState(hojeIso);
  const [turno, setTurno] = useState<string>("MANHA");
  const [horaInicio, setHoraInicio] = useState("07:00");
  const [horaFim, setHoraFim] = useState("13:00");
  const [observacoes, setObservacoes] = useState("");
  const [estado, acao, salvando] = useActionState(
    async (prev: { erro?: string; ok?: string }, form: FormData) => {
      const res = await criarTurnoEscala(prev, form);
      if (res.ok) setObservacoes("");
      return res;
    },
    {},
  );
  const [filtroCasa, setFiltroCasa] = useState("TODAS");
  const [turnoParaRemover, setTurnoParaRemover] = useState<TurnoEscalaGestor | null>(null);
  const [erroRemover, setErroRemover] = useState("");
  const [removendo, startRemocao] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelarBtnRef = useRef<HTMLButtonElement>(null);
  const removendoRef = useRef(false);

  const turnosFiltrados = useMemo(
    () =>
      filtroCasa === "TODAS" ? turnos : turnos.filter((t) => t.casaId === filtroCasa),
    [turnos, filtroCasa],
  );

  useEffect(() => {
    removendoRef.current = removendo;
    const dialog = dialogRef.current;
    if (dialog) dialog.setAttribute("closedby", removendo ? "none" : "any");
  }, [removendo]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.setAttribute("closedby", removendoRef.current ? "none" : "any");
    if ("closedBy" in HTMLDialogElement.prototype) return;

    const fora = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    let pressionouFora = false;
    const onDown = (e: PointerEvent) => {
      pressionouFora = fora(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressionouFora && fora(e) && !removendoRef.current) dialog.close();
      pressionouFora = false;
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  function aoTrocarTurno(novo: string) {
    setTurno(novo);
    const padrao = OPCOES_TURNO.find((o) => o.valor === novo);
    if (padrao) {
      setHoraInicio(padrao.inicio);
      setHoraFim(padrao.fim);
    }
  }

  function pedirConfirmacaoRemocao(t: TurnoEscalaGestor) {
    setErroRemover("");
    setTurnoParaRemover(t);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      cancelarBtnRef.current?.focus();
    }
  }

  function confirmarRemocao() {
    if (!turnoParaRemover) return;
    setErroRemover("");
    const alvoId = turnoParaRemover.id;
    startRemocao(async () => {
      const res = await removerTurnoEscala(alvoId);
      if (res.erro) {
        setErroRemover(res.erro);
        return;
      }
      dialogRef.current?.close();
      setTurnoParaRemover(null);
    });
  }

  return (
    <section className="space-y-5 border-t border-border pt-8">
      <header>
        <h2 className="font-heading text-xl font-semibold">Escala de turnos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Monte os plantões da equipe. Os turnos aparecem automaticamente na aba Minha escala do
          Painel do Funcionário.
        </p>
      </header>

      {!disponivel ? (
        <div className="flex items-start gap-3 rounded-sm border border-warning/40 bg-warning/10 p-5 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-muted-foreground">
            Para publicar escalas, aplique a migration{" "}
            <code className="rounded bg-card px-1.5 py-0.5 text-xs text-foreground">
              0015_escala_chat.sql
            </code>{" "}
            no SQL Editor do Supabase.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <form
            action={acao}
            className="space-y-4 rounded-sm border border-border bg-card p-5 lg:col-span-1"
          >
            <h3 className="font-heading text-base font-semibold">Novo turno</h3>

            <div>
              <label htmlFor={`${baseId}-prof`} className={labelClass}>
                Profissional *
              </label>
              <select
                id={`${baseId}-prof`}
                name="vinculoId"
                required
                value={vinculoId}
                onChange={(e) => setVinculoId(e.target.value)}
                className={`${inputClass} mt-1 cursor-pointer bg-card`}
              >
                <option value="">Selecione...</option>
                {ativos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} · {m.casaNome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${baseId}-data`} className={labelClass}>
                  Data *
                </label>
                <input
                  id={`${baseId}-data`}
                  name="data"
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </div>

              <div>
                <label htmlFor={`${baseId}-turno`} className={labelClass}>
                  Turno *
                </label>
                <select
                  id={`${baseId}-turno`}
                  name="turno"
                  value={turno}
                  onChange={(e) => aoTrocarTurno(e.target.value)}
                  className={`${inputClass} mt-1 cursor-pointer bg-card`}
                >
                  {OPCOES_TURNO.map((op) => (
                    <option key={op.valor} value={op.valor}>
                      {op.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${baseId}-ini`} className={labelClass}>
                  Início *
                </label>
                <input
                  id={`${baseId}-ini`}
                  name="horaInicio"
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label htmlFor={`${baseId}-fim`} className={labelClass}>
                  Fim *
                </label>
                <input
                  id={`${baseId}-fim`}
                  name="horaFim"
                  type="time"
                  required
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${baseId}-obs`} className={labelClass}>
                Observação (opcional)
              </label>
              <input
                id={`${baseId}-obs`}
                name="observacoes"
                type="text"
                maxLength={500}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex.: Ala norte, cobertura de folga..."
                className={`${inputClass} mt-1`}
              />
            </div>

            {estado.erro ? (
              <p role="alert" className="text-xs font-medium text-danger">
                {estado.erro}
              </p>
            ) : null}
            {estado.ok ? (
              <p role="status" className="text-xs font-medium text-success">
                {estado.ok}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={salvando || ativos.length === 0}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden="true" />
                  Adicionar turno
                </>
              )}
            </button>
          </form>

          <div className="rounded-sm border border-border bg-card p-5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading text-base font-semibold">
                Turnos cadastrados ({turnosFiltrados.length})
              </h3>

              {casas.length > 1 ? (
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Filtrar turnos por casa"
                >
                  <button
                    type="button"
                    aria-pressed={filtroCasa === "TODAS"}
                    onClick={() => setFiltroCasa("TODAS")}
                    className={cn(
                      "min-h-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                      filtroCasa === "TODAS"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    Todas as casas
                  </button>
                  {casas.map((casa) => (
                    <button
                      key={casa.id}
                      type="button"
                      aria-pressed={filtroCasa === casa.id}
                      onClick={() => setFiltroCasa(casa.id)}
                      className={cn(
                        "min-h-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                        filtroCasa === casa.id
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {casa.nome}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {turnosFiltrados.length === 0 ? (
              <div className="mt-6 py-6 text-center text-sm text-muted-foreground">
                <CalendarClock className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
                <p className="mt-2">
                  {turnos.length === 0
                    ? "Nenhum turno cadastrado ainda."
                    : "Nenhum turno cadastrado para esta casa."}
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {turnosFiltrados.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {t.profissionalNome}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          · {rotuloCargo(t.cargo)} · {t.casaNome}
                        </span>
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="font-medium text-brand-strong">
                          {dataCurta(t.data)}
                        </span>
                        <span>·</span>
                        <span>{ROTULO_TURNO.get(t.turno) ?? t.turno}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          {t.horaInicio} – {t.horaFim}
                        </span>
                      </p>
                      {t.observacoes ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{t.observacoes}</p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => pedirConfirmacaoRemocao(t)}
                      aria-label={`Remover turno de ${t.profissionalNome} em ${dataCurta(t.data)}`}
                      className="inline-flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-danger"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={`${baseId}-remover-titulo`}
        onCancel={(e) => {
          if (removendo) e.preventDefault();
        }}
        onClose={(e) => {
          e.currentTarget.returnValue = "";
          if (!removendo) {
            setTurnoParaRemover(null);
            setErroRemover("");
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-sm border border-border bg-card p-6 text-foreground shadow-xl"
      >
        <h3 id={`${baseId}-remover-titulo`} className="font-heading text-lg font-semibold">
          Remover turno da escala?
        </h3>
        {turnoParaRemover ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O plantão de{" "}
            <strong className="font-semibold text-foreground">
              {turnoParaRemover.profissionalNome}
            </strong>{" "}
            em{" "}
            <strong className="font-semibold text-foreground">
              {dataCurta(turnoParaRemover.data)}
            </strong>{" "}
            ({turnoParaRemover.horaInicio} – {turnoParaRemover.horaFim}, {turnoParaRemover.casaNome}
            ) será removido da escala da equipe.
          </p>
        ) : null}

        {erroRemover ? (
          <p role="alert" className="mt-3 text-xs font-medium text-danger">
            {erroRemover}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelarBtnRef}
            type="button"
            disabled={removendo}
            onClick={() => dialogRef.current?.close()}
            className="inline-flex min-h-10 items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={removendo}
            onClick={confirmarRemocao}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-danger px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {removendo ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Removendo...
              </>
            ) : (
              "Remover turno"
            )}
          </button>
        </div>
      </dialog>
    </section>
  );
}
