import { useEffect, useMemo, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { ArrowRight, Pause, Play, RotateCcw, Wrench } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { OLA_DEFAULT_THRESHOLDS, OLA_INDEX_SAMPLES, type OlaIndexSample, JOB_TSQL_SNIPPETS } from '../../../data/industryJobsData';
import { cn } from '../../../lib/utils';
import { CopyCodeBlock } from '../../Shared/CopyCodeBlock';

type ActionId = 'skip' | 'reorganize' | 'rebuild';
type PhaseId = 'queue' | 'gate' | 'bin';

type Totals = { cpu: number; logMb: number; seconds: number };

const ACTION_STYLE: Record<ActionId, { border: string; bg: string; text: string; chip: string }> = {
  skip: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    chip: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
  },
  reorganize: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    chip: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  },
  rebuild: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    chip: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
  },
};

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function decideAction(index: OlaIndexSample, reorganizeFromPct: number, rebuildFromPct: number): ActionId {
  if (index.fragPct < reorganizeFromPct) return 'skip';
  if (index.fragPct < rebuildFromPct) return 'reorganize';
  return 'rebuild';
}

function costModel(index: OlaIndexSample, action: ActionId): Totals {
  const size = index.sizeMb;
  const hotMultiplier = index.writesPerMin >= 1200 ? 1.15 : index.writesPerMin >= 800 ? 1.08 : 1.0;
  const rebuild = {
    cpu: size * 1.0 * hotMultiplier,
    logMb: size * 1.25,
    seconds: size * 0.11 * hotMultiplier,
  };
  if (action === 'rebuild') return rebuild;
  if (action === 'reorganize') {
    return {
      cpu: size * 0.28 * hotMultiplier,
      logMb: size * 0.08,
      seconds: size * 0.06 * hotMultiplier,
    };
  }
  return { cpu: 0, logMb: 0, seconds: 0 };
}

function addTotals(left: Totals, right: Totals): Totals {
  return { cpu: left.cpu + right.cpu, logMb: left.logMb + right.logMb, seconds: left.seconds + right.seconds };
}

function fmtPct(value: number) {
  return `${Math.max(0, Math.round(value))}%`;
}

function fmtSeconds(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const sec = Math.round(seconds - mins * 60);
  return `${mins}m ${sec}s`;
}

function IndexCard({ sample }: { sample: OlaIndexSample }) {
  return (
    <motion.div
      layout
      className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-[0_0_18px_rgba(255,255,255,0.03)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{sample.name}</div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
            {sample.sizeMb} MB · {sample.pages.toLocaleString()} pages
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/75">
          {sample.fragPct}% frag
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-white/50">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
          writes/min: {sample.writesPerMin}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
          hot index
        </span>
      </div>
    </motion.div>
  );
}

export function OlaHallengrenSimulator() {
  const { language } = useLanguage();
  const [reorgFromPct, setReorgFromPct] = useState(OLA_DEFAULT_THRESHOLDS.reorganizeFromPct);
  const [rebuildFromPct, setRebuildFromPct] = useState(OLA_DEFAULT_THRESHOLDS.rebuildFromPct);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<PhaseId>('queue');
  const [processed, setProcessed] = useState<Record<string, ActionId>>({});
  const [olaTotals, setOlaTotals] = useState<Totals>({ cpu: 0, logMb: 0, seconds: 0 });
  const [planTotals, setPlanTotals] = useState<Totals>({ cpu: 0, logMb: 0, seconds: 0 });

  const sample = cursor < OLA_INDEX_SAMPLES.length ? OLA_INDEX_SAMPLES[cursor] : undefined;
  const action = useMemo(() => {
    if (!sample) return 'skip' as const;
    return decideAction(sample, reorgFromPct, rebuildFromPct);
  }, [rebuildFromPct, reorgFromPct, sample]);

  const totalSavingsPct = useMemo(() => {
    const planLog = planTotals.logMb;
    const olaLog = olaTotals.logMb;
    if (planLog <= 0) return 0;
    return ((planLog - olaLog) / planLog) * 100;
  }, [olaTotals.logMb, planTotals.logMb]);

  const reset = () => {
    setPlaying(false);
    setCursor(0);
    setPhase('queue');
    setProcessed({});
    setOlaTotals({ cpu: 0, logMb: 0, seconds: 0 });
    setPlanTotals({ cpu: 0, logMb: 0, seconds: 0 });
  };

  useEffect(() => {
    if (!playing) return;
    if (cursor >= OLA_INDEX_SAMPLES.length) {
      setPlaying(false);
      setPhase('queue');
      return;
    }
    if (!sample) return;

    setPhase('queue');
    const t1 = window.setTimeout(() => setPhase('gate'), 650);
    const t2 = window.setTimeout(() => setPhase('bin'), 1300);
    const t3 = window.setTimeout(() => {
      const planCost = costModel(sample, 'rebuild');
      const olaCost = costModel(sample, action);
      setPlanTotals((prev) => addTotals(prev, planCost));
      setOlaTotals((prev) => addTotals(prev, olaCost));
      setProcessed((prev) => ({ ...prev, [sample.id]: action }));
      setCursor((c) => c + 1);
      setPhase('queue');
    }, 2150);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [action, cursor, playing, sample]);

  const ruleText = useMemo(() => {
    return language === 'es'
      ? `Si frag < ${reorgFromPct}% => SKIP · Si frag >= ${reorgFromPct}% y < ${rebuildFromPct}% => REORGANIZE · Si frag >= ${rebuildFromPct}% => REBUILD`
      : `If frag < ${reorgFromPct}% => SKIP · If frag >= ${reorgFromPct}% and < ${rebuildFromPct}% => REORGANIZE · If frag >= ${rebuildFromPct}% => REBUILD`;
  }, [language, reorgFromPct, rebuildFromPct]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[280px] flex-1">
            <h3 className="text-xl font-bold text-amber-300 flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {language === 'es' ? 'IndexOptimize (Ola Hallengren) en 90 segundos' : 'IndexOptimize (Ola Hallengren) in 90 seconds'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === 'es'
                ? 'Simula como el job decide entre SKIP/REORGANIZE/REBUILD segun fragmentacion, y compara contra el clasico Maintenance Plan: REBUILD ALL.'
                : 'Simulate how the job decides SKIP/REORGANIZE/REBUILD by fragmentation, and compare against the classic Maintenance Plan: REBUILD ALL.'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            <button
              onClick={() => setPlaying((p) => !p)}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2',
                playing ? 'bg-rose-500/15 text-rose-200' : 'bg-emerald-500/15 text-emerald-200'
              )}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? (language === 'es' ? 'Pausar' : 'Pause') : language === 'es' ? 'Auto run' : 'Auto run'}
            </button>
            <button
              onClick={reset}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {language === 'es' ? 'Reset' : 'Reset'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Umbrales (editables)' : 'Thresholds (editable)'}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white/70">
                  <span>{language === 'es' ? 'REORGANIZE desde' : 'REORGANIZE from'}</span>
                  <span className="text-amber-300">{reorgFromPct}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={1}
                  value={reorgFromPct}
                  onChange={(e) => {
                    const next = clamp(1, Number(e.target.value), 25);
                    setReorgFromPct(Math.min(next, rebuildFromPct - 1));
                  }}
                  className="accent-amber-400 w-full"
                />
              </label>
              <label className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white/70">
                  <span>{language === 'es' ? 'REBUILD desde' : 'REBUILD from'}</span>
                  <span className="text-rose-300">{rebuildFromPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  step={1}
                  value={rebuildFromPct}
                  onChange={(e) => {
                    const next = clamp(10, Number(e.target.value), 80);
                    setRebuildFromPct(Math.max(next, reorgFromPct + 1));
                  }}
                  className="accent-rose-400 w-full"
                />
              </label>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/60 font-mono">
              {ruleText}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Comparativa (acumulado)' : 'Comparison (totals)'}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                <div className="text-xs font-bold text-rose-200">{language === 'es' ? 'Maintenance Plan' : 'Maintenance Plan'}</div>
                <div className="mt-2 text-xs text-white/65">
                  CPU: <span className="font-bold text-white">{Math.round(planTotals.cpu)}</span>
                </div>
                <div className="mt-1 text-xs text-white/65">
                  Log: <span className="font-bold text-white">{Math.round(planTotals.logMb)} MB</span>
                </div>
                <div className="mt-1 text-xs text-white/65">
                  Time: <span className="font-bold text-white">{fmtSeconds(planTotals.seconds)}</span>
                </div>
                <div className="mt-3 inline-flex rounded-full border border-rose-500/30 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200">
                  REBUILD ALL
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="text-xs font-bold text-amber-200">{language === 'es' ? 'Ola IndexOptimize' : 'Ola IndexOptimize'}</div>
                <div className="mt-2 text-xs text-white/65">
                  CPU: <span className="font-bold text-white">{Math.round(olaTotals.cpu)}</span>
                </div>
                <div className="mt-1 text-xs text-white/65">
                  Log: <span className="font-bold text-white">{Math.round(olaTotals.logMb)} MB</span>
                </div>
                <div className="mt-1 text-xs text-white/65">
                  Time: <span className="font-bold text-white">{fmtSeconds(olaTotals.seconds)}</span>
                </div>
                <div className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                  SMART
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-white/70">{language === 'es' ? 'Ahorro de log' : 'Log savings'}</div>
                <div className="text-sm font-black text-emerald-300">{fmtPct(totalSavingsPct)}</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${clamp(0, totalSavingsPct, 100)}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              <ArrowRight className="h-4 w-4" />
              {language === 'es' ? 'Flujo visual' : 'Visual flow'}
            </div>

            <LayoutGroup id="ola-flow">
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs font-bold text-white/70">{language === 'es' ? 'Entrada' : 'Input'}</div>
                  <div className="mt-2 text-[11px] text-white/55">
                    {language === 'es' ? 'Indices en cola' : 'Indexes in queue'}
                  </div>
                  <div className="mt-4 min-h-[92px]">
                    {sample && phase === 'queue' && (
                      <motion.div layoutId="index-card" layout>
                        <IndexCard sample={sample} />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs font-bold text-white/70">{language === 'es' ? 'Decision' : 'Decision'}</div>
                  <div className="mt-2 text-[11px] text-white/55">
                    {language === 'es' ? 'Regla por fragmentacion' : 'Fragmentation rule'}
                  </div>
                  <div className="mt-4 min-h-[92px]">
                    {sample && phase === 'gate' && (
                      <motion.div layoutId="index-card" layout>
                        <IndexCard sample={sample} />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs font-bold text-white/70">{language === 'es' ? 'Salida' : 'Output'}</div>
                  <div className="mt-2 text-[11px] text-white/55">
                    {language === 'es' ? 'Se desvía a la operacion' : 'Routed to operation'}
                  </div>
                  <div className="mt-4 grid gap-3">
                    {(['skip', 'reorganize', 'rebuild'] as const).map((id) => {
                      const style = ACTION_STYLE[id];
                      const isTarget = phase === 'bin' && action === id;
                      return (
                        <div
                          key={id}
                          className={cn(
                            'rounded-3xl border p-4 transition-all',
                            style.border,
                            style.bg,
                            isTarget ? 'shadow-[0_0_22px_rgba(255,255,255,0.06)]' : 'opacity-85'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className={cn('text-xs font-black uppercase tracking-[0.18em]', style.text)}>{id}</div>
                            <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', style.chip)}>
                              {id === 'skip' ? '< low' : id === 'reorganize' ? 'medium' : 'high'}
                            </span>
                          </div>
                          <div className="mt-3 min-h-[86px]">
                            {sample && phase === 'bin' && action === id && (
                              <motion.div layoutId="index-card" layout>
                                <IndexCard sample={sample} />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </LayoutGroup>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {OLA_INDEX_SAMPLES.map((item) => {
                const result = processed[item.id];
                const resultStyle = result ? ACTION_STYLE[result] : null;
                return (
                  <div key={item.id} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white">{item.name}</div>
                        <div className="mt-1 text-[11px] text-white/50">
                          frag: <span className="font-bold text-white/80">{item.fragPct}%</span> · size:{' '}
                          <span className="font-bold text-white/80">{item.sizeMb} MB</span>
                        </div>
                      </div>
                      {result ? (
                        <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', resultStyle?.chip)}>
                          {result}
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                          pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 p-6">
            <h4 className="text-lg font-bold text-white">
              {language === 'es' ? 'T-SQL (listo para copiar)' : 'Ready-to-paste T-SQL'}
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === 'es'
                ? 'Ejemplo de ejecucion tipica del job. (No incluye el instalador; en produccion se usa la SQL Server Maintenance Solution).'
                : 'Example of a typical job execution. (Not an installer; production uses the SQL Server Maintenance Solution).'}
            </p>
            <div className="mt-5 space-y-4">
              <CopyCodeBlock code={JOB_TSQL_SNIPPETS.olaIndexOptimize} accent="amber" />
              <CopyCodeBlock code={JOB_TSQL_SNIPPETS.olaIntegrity} accent="emerald" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-bold text-white">{language === 'es' ? 'Por que es mejor que Maintenance Plans' : 'Why this beats Maintenance Plans'}</h4>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/70">
            {language === 'es' ? 'Menos IO y menos Log' : 'Less IO + less Log'}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            {
              title: { en: 'Do no harm', es: 'No hagas dano' },
              body: {
                en: 'Skip low-fragmentation indexes so you do not generate log, IO and CPU for nothing.',
                es: 'Salta indices con poca fragmentacion para no generar log, IO y CPU sin necesidad.',
              },
            },
            {
              title: { en: 'Right operation', es: 'Operacion correcta' },
              body: {
                en: 'REORGANIZE is lighter; REBUILD is heavier. Picking the right one reduces risk under load.',
                es: 'REORGANIZE es mas ligero; REBUILD es mas pesado. Elegir bien reduce riesgo bajo carga.',
              },
            },
            {
              title: { en: 'Operational visibility', es: 'Visibilidad operativa' },
              body: {
                en: 'Logging to table and consistent job design makes auditing and debugging much easier.',
                es: 'Loguear a tabla y un diseno consistente de jobs hace mas facil auditar y depurar.',
              },
            },
          ].map((card) => (
            <div key={card.title.en} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                {language === 'es' ? card.title.es : card.title.en}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/75">{language === 'es' ? card.body.es : card.body.en}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

