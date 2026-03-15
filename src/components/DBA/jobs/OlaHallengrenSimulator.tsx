import { useEffect, useMemo, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { ArrowRight, Pause, Play, RotateCcw, Wrench } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { OLA_DEFAULT_THRESHOLDS, OLA_INDEX_SAMPLES, type OlaIndexSample, JOB_TSQL_SNIPPETS } from '../../../data/industryJobsData';
import { cn } from '../../../lib/utils';
import { CopyCodeBlock } from '../../Shared/CopyCodeBlock';
import { DBAActionBoard } from '../../Shared/DBAActionBoard';
import { GuidedLabPanel } from '../../Shared/GuidedLabPanel';

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

const GUIDE_STEPS = [
  {
    title: { en: 'Watch the index enter the queue', es: 'Mira cómo entra el índice en la cola' },
    detail: {
      en: 'Start by reading fragmentation, size and write rate. That tells you whether maintenance will hurt or help.',
      es: 'Empieza leyendo fragmentación, tamaño y tasa de escrituras. Eso te dice si el mantenimiento va a ayudar o va a doler.',
    },
  },
  {
    title: { en: 'Understand the decision gate', es: 'Entiende la puerta de decisión' },
    detail: {
      en: 'The useful part is not the rebuild itself: it is the rule that avoids rebuilding everything.',
      es: 'La parte útil no es el rebuild en sí: es la regla que evita reconstruirlo todo.',
    },
  },
  {
    title: { en: 'See the routed operation', es: 'Ve la operación a la que se desvía' },
    detail: {
      en: 'Once the index lands in SKIP, REORGANIZE or REBUILD, compare how much log and CPU that choice consumes.',
      es: 'Cuando el índice cae en SKIP, REORGANIZE o REBUILD, compara cuánto log y cuánta CPU consume esa elección.',
    },
  },
  {
    title: { en: 'Finish with the totals', es: 'Termina leyendo el acumulado' },
    detail: {
      en: 'The real lesson is operational: less log, less IO and less maintenance pain than a rebuild-all plan.',
      es: 'La lección real es operativa: menos log, menos IO y menos dolor que con un rebuild-all.',
    },
  },
] as const;

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

interface OlaHallengrenSimulatorProps {
  compact?: boolean;
}

export function OlaHallengrenSimulator({ compact = false }: OlaHallengrenSimulatorProps) {
  const { language } = useLanguage();
  const [reorgFromPct, setReorgFromPct] = useState<number>(OLA_DEFAULT_THRESHOLDS.reorganizeFromPct);
  const [rebuildFromPct, setRebuildFromPct] = useState<number>(OLA_DEFAULT_THRESHOLDS.rebuildFromPct);
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

  const liveQueryText = useMemo(() => {
    if (!sample) {
      return language === 'es'
        ? 'Sin indices pendientes. La cola de mantenimiento ha terminado.'
        : 'No pending indexes. Maintenance queue has finished.';
    }
    const actionLabel = action.toUpperCase();
    return `EXEC dbo.IndexOptimize @Databases='USER_DATABASES', @Indexes='${sample.name}', @Action='${actionLabel}', @FragmentationLevel1=${reorgFromPct}, @FragmentationLevel2=${rebuildFromPct};`;
  }, [action, language, rebuildFromPct, reorgFromPct, sample]);

  const guideStep = cursor >= OLA_INDEX_SAMPLES.length ? 3 : phase === 'queue' ? 0 : phase === 'gate' ? 1 : 2;
  const dbaFocus =
    cursor >= OLA_INDEX_SAMPLES.length
      ? {
          en: 'The queue is done. Now the DBA compares smart maintenance against rebuild-all and decides whether the thresholds fit the real estate.',
          es: 'La cola ha terminado. Ahora el DBA compara mantenimiento inteligente contra rebuild-all y decide si los umbrales encajan con el estate real.',
        }
      : phase === 'queue'
        ? {
            en: 'Read the incoming index like an operational object: fragmentation alone is not enough.',
            es: 'Lee el índice entrante como un objeto operativo: la fragmentación sola no basta.',
          }
        : phase === 'gate'
          ? {
              en: 'Validate the decision gate against size, write rate and maintenance window before touching production.',
              es: 'Valida la puerta de decisión contra tamaño, ritmo de escritura y ventana de mantenimiento antes de tocar producción.',
            }
          : action === 'skip'
            ? {
                en: 'The best maintenance is often doing nothing. The DBA now validates that skipping is safe and documented.',
                es: 'Muchas veces el mejor mantenimiento es no hacer nada. Ahora el DBA valida que saltarlo es seguro y queda documentado.',
              }
            : action === 'reorganize'
              ? {
                  en: 'REORGANIZE is the low-risk path. The DBA now verifies duration, log churn and whether the index stays healthy enough.',
                  es: 'REORGANIZE es la via de bajo riesgo. Ahora el DBA valida duracion, churn de log y si el indice queda lo bastante sano.',
                }
              : {
                  en: 'REBUILD is the heavy move. The DBA now checks log capacity, maintenance window and write pressure before letting it run.',
                  es: 'REBUILD es el movimiento pesado. Ahora el DBA comprueba capacidad de log, ventana de mantenimiento y presión de escrituras antes de dejarlo correr.',
                };

  const dbaActions =
    cursor >= OLA_INDEX_SAMPLES.length
      ? [
          {
            en: 'Compare total log MB and elapsed time against a rebuild-all baseline before calling the strategy good.',
            es: 'Compara MB de log totales y tiempo acumulado contra un baseline rebuild-all antes de dar la estrategia por buena.',
          },
          {
            en: 'Review msdb history or LogToTable output so the job is auditable, not just fast.',
            es: 'Revisa el historial de msdb o la salida LogToTable para que el job sea auditable, no solo rapido.',
          },
          {
            en: 'Tune thresholds per estate, not by folklore: OLTP, ETL and DW windows rarely want the same cutoffs.',
            es: 'Ajusta umbrales por estate, no por folclore: OLTP, ETL y DW rara vez quieren los mismos cortes.',
          },
        ]
      : phase === 'queue'
        ? [
            {
              en: 'Check fragmentation, pages and write rate together before deciding whether maintenance is worth the churn.',
              es: 'Revisa fragmentación, páginas y ritmo de escritura juntas antes de decidir si el mantenimiento compensa el churn.',
            },
            {
              en: 'Ask whether the query pain is really fragmentation or a missing/covering index problem.',
              es: 'Pregúntate si el dolor de la query es de fragmentación o realmente de un índice ausente/no cubriente.',
            },
            {
              en: 'Confirm the maintenance window and log backup cadence before heavy operations.',
              es: 'Confirma la ventana de mantenimiento y la cadencia de log backups antes de operaciones pesadas.',
            },
          ]
        : phase === 'gate'
          ? [
              {
                en: 'Validate the rule against actual workload, not just the percentage shown by a report.',
                es: 'Valida la regla contra la carga real, no solo contra el porcentaje que muestra un informe.',
              },
              {
                en: 'Consider that a 15% hot index can hurt more operationally than a cold 45% one.',
                es: 'Ten en cuenta que un indice caliente al 15% puede doler mas operativamente que uno frio al 45%.',
              },
              {
                en: 'If in doubt, prefer the safer operation and measure its result on the next cycle.',
                es: 'Si dudas, prefiere la operación más segura y mide su resultado en el siguiente ciclo.',
              },
            ]
          : action === 'skip'
            ? [
                {
                  en: 'Document the skip so nobody turns it into a blind rebuild later.',
                  es: 'Documenta el skip para que nadie lo convierta luego en un rebuild ciego.',
                },
                {
                  en: 'Watch whether user complaints point to plan shape or lookups instead of fragmentation.',
                  es: 'Observa si las quejas de usuarios apuntan a forma de plan o lookups y no a fragmentación.',
                },
                {
                  en: 'Recheck next cycle instead of spending log and IO now for no return.',
                  es: 'Vuelve a medir en el siguiente ciclo en lugar de gastar log e IO ahora para nada.',
                },
              ]
            : action === 'reorganize'
              ? [
                  {
                    en: 'Track elapsed time and log churn to confirm REORGANIZE really stays lighter here.',
                    es: 'Sigue tiempo acumulado y churn de log para confirmar que aquí REORGANIZE de verdad es más ligero.',
                  },
                  {
                    en: 'Validate whether stats still need a separate update after the operation.',
                    es: 'Valida si después de la operación siguen necesitando un update stats aparte.',
                  },
                  {
                    en: 'If fragmentation rebounds quickly, the root cause may be fillfactor or insert pattern.',
                    es: 'Si la fragmentación reaparece rápido, la causa raíz puede ser fillfactor o patrón de inserción.',
                  },
                ]
              : [
                  {
                    en: 'Check log size, VLF shape and backup cadence before a heavy rebuild starts.',
                    es: 'Comprueba tamaño del log, forma de VLFs y cadencia de backups antes de que arranque un rebuild pesado.',
                  },
                  {
                    en: 'Confirm the window really tolerates CPU, IO and locking side effects.',
                    es: 'Confirma que la ventana de verdad tolera efectos laterales de CPU, IO y locking.',
                  },
                  {
                    en: 'After the rebuild, validate whether the pain was fragmentation or really an index-design problem.',
                    es: 'Tras el rebuild, valida si el dolor era de fragmentación o realmente de diseño de índice.',
                  },
                ];

  return (
    <div className={cn('grid gap-4 lg:gap-6 h-full', compact ? 'xl:grid-cols-[minmax(0,1.08fr)_340px]' : 'xl:grid-cols-[minmax(0,1.2fr)_420px]')}>
      <div className={cn('glass-panel rounded-2xl border border-white/10 p-4 sm:p-6', compact && 'min-h-0 overflow-hidden flex flex-col')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          {!compact ? (
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-amber-300 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                {language === 'es' ? 'IndexOptimize (Ola Hallengren) en 90 segundos' : 'IndexOptimize (Ola Hallengren) in 90 seconds'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {language === 'es'
                  ? 'Simula cómo el job decide entre SKIP/REORGANIZE/REBUILD según fragmentación, y compara contra el clásico Maintenance Plan: REBUILD ALL.'
                  : 'Simulate how the job decides SKIP/REORGANIZE/REBUILD by fragmentation, and compare against the classic Maintenance Plan: REBUILD ALL.'}
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                {language === 'es' ? 'Play en vivo' : 'Live play'}
              </div>
              <p className="mt-2 text-sm text-white/75">
                {language === 'es'
                  ? 'Verás la query que entra y la decisión del job en tiempo real.'
                  : 'You will see incoming query text and job decision in real time.'}
              </p>
            </div>
          )}
          <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-1 sm:w-auto">
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

        {!compact ? <div className="mt-5">
          <GuidedLabPanel
            language={language}
            compact={compact}
            accent="amber"
            title={{ en: 'How to learn from this lab', es: 'Cómo aprender con este lab' }}
            objective={{
              en: 'Do not look at Ola as a script only. Look at it as a decision engine that reduces unnecessary maintenance work.',
              es: 'No mires Ola solo como un script. Míralo como un motor de decisión que reduce mantenimiento innecesario.',
            }}
            watchItems={[
              {
                en: 'Fragmentation by itself is not enough: size and write rate change the risk.',
                es: 'La fragmentación sola no basta: el tamaño y la tasa de escrituras cambian el riesgo.',
              },
              {
                en: 'The key idea is avoiding REBUILD ALL when the index does not need it.',
                es: 'La idea clave es evitar REBUILD ALL cuando el índice no lo necesita.',
              },
              {
                en: 'Read the final CPU/log totals as the real operational cost of the chosen strategy.',
                es: 'Lee los totales finales de CPU/log como el coste operativo real de la estrategia elegida.',
              },
            ]}
            steps={GUIDE_STEPS}
            currentStep={guideStep}
            footer={{
              en: 'If you can explain why an index was skipped, reorganized or rebuilt, you already understood the lab.',
              es: 'Si sabes explicar por qué un índice fue saltado, reorganizado o reconstruido, ya entendiste el lab.',
            }}
          />
        </div> : null}

        {compact ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
                {language === 'es' ? 'Query que entra' : 'Incoming query'}
              </div>
              <div className="mt-2 rounded-xl border border-white/10 bg-black/35 p-3 font-mono text-xs text-cyan-100 whitespace-pre-wrap break-words">
                {liveQueryText}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: language === 'es' ? 'Fase' : 'Phase', value: phase.toUpperCase() },
                { label: language === 'es' ? 'Decision' : 'Decision', value: action.toUpperCase() },
                { label: language === 'es' ? 'Ahorro log' : 'Log saved', value: fmtPct(totalSavingsPct) },
              ].map((cell) => (
                <div key={cell.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{cell.label}</div>
                  <div className="mt-2 text-sm font-black text-white">{cell.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!compact ? <div className="mt-6 grid gap-4 md:grid-cols-2">
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
        </div> : null}

        <div className={cn('mt-6 grid gap-4', compact && 'min-h-0 flex-1')}>
          <div className={cn('rounded-2xl border border-white/10 bg-black/20 p-5', compact && 'min-h-0 flex-1 overflow-hidden flex flex-col')}>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              <ArrowRight className="h-4 w-4" />
              {language === 'es' ? 'Flujo visual' : 'Visual flow'}
            </div>

            <LayoutGroup id="ola-flow">
              <div className={cn('mt-4 grid gap-3 lg:grid-cols-3', compact && 'min-h-0 flex-1')}>
                <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs font-bold text-white/70">{language === 'es' ? 'Entrada' : 'Input'}</div>
                  <div className="mt-2 text-[11px] text-white/55">
                    {language === 'es' ? 'Indices en cola' : 'Indexes in queue'}
                  </div>
                  <div className={cn('mt-4 min-h-[92px]', compact && 'lg:min-h-[140px]')}>
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
                    {language === 'es' ? 'Regla por fragmentación' : 'Fragmentation rule'}
                  </div>
                  <div className={cn('mt-4 min-h-[92px]', compact && 'lg:min-h-[140px]')}>
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
                    {language === 'es' ? 'Se desvía a la operación' : 'Routed to operation'}
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
                          <div className={cn('mt-3 min-h-[86px]', compact && 'lg:min-h-[110px]')}>
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

            <div className={cn('mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3', compact && 'overflow-y-auto pr-1')}>
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

          {!compact ? (
            <div className="glass-panel rounded-2xl border border-white/10 p-6">
              <h4 className="text-lg font-bold text-white">
                {language === 'es' ? 'T-SQL (listo para copiar)' : 'Ready-to-paste T-SQL'}
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                {language === 'es'
                  ? 'Ejemplo de ejecución típica del job. (No incluye el instalador; en producción se usa la SQL Server Maintenance Solution).'
                  : 'Example of a typical job execution. (Not an installer; production uses the SQL Server Maintenance Solution).'}
              </p>
              <div className="mt-5 space-y-4">
                <CopyCodeBlock code={JOB_TSQL_SNIPPETS.olaIndexOptimize} accent="amber" />
                <CopyCodeBlock code={JOB_TSQL_SNIPPETS.olaIntegrity} accent="emerald" />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {compact ? (
        <div className="grid min-h-0 h-full gap-4 xl:grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="glass-panel rounded-2xl border border-white/10 p-4">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { label: language === 'es' ? 'CPU smart' : 'Smart CPU', value: Math.round(olaTotals.cpu).toString() },
                { label: language === 'es' ? 'Log smart' : 'Smart log', value: `${Math.round(olaTotals.logMb)} MB` },
                { label: language === 'es' ? 'Rebuild all' : 'Rebuild all', value: `${Math.round(planTotals.logMb)} MB` },
              ].map((cell) => (
                <div key={cell.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{cell.label}</div>
                  <div className="mt-2 text-base font-black text-white">{cell.value}</div>
                </div>
              ))}
            </div>
          </div>

          <DBAActionBoard
            language={language}
            accent={action === 'rebuild' ? 'rose' : action === 'reorganize' ? 'amber' : 'emerald'}
            title={{ en: 'What the DBA does now', es: 'Que hace ahora el DBA' }}
            focus={dbaFocus}
            actions={dbaActions}
            caution={{
              en: 'Do not treat fragmentation percentage as the only truth. Size, writes, recovery objectives and log pressure matter too.',
              es: 'No trates el porcentaje de fragmentación como la única verdad. También importan tamaño, escrituras, recovery objectives y presión sobre el log.',
            }}
          />

          <div className="glass-panel rounded-2xl border border-white/10 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Script listo para probar' : 'Ready-to-test script'}
            </div>
            <div className="mt-3">
              <CopyCodeBlock code={liveQueryText} accent="cyan" contentClassName="max-h-[220px]" />
            </div>
          </div>
        </div>
      ) : null}

      {!compact ? (
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-bold text-white">{language === 'es' ? 'Por qué es mejor que Maintenance Plans' : 'Why this beats Maintenance Plans'}</h4>
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
                es: 'Salta índices con poca fragmentación para no generar log, IO y CPU sin necesidad.',
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
                es: 'Loguear a tabla y un diseño consistente de jobs hace más fácil auditar y depurar.',
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
      ) : null}
    </div>
  );
}
