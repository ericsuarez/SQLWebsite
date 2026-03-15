import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Database,
  FlaskConical,
  HardDrive,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { TEMPDB_IO_DIAGNOSTIC_CASES } from '../../data/tempdbIoPlaybooks';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

type ViewMode = 'intro' | 'play';
type DiagnosticCaseId = (typeof TEMPDB_IO_DIAGNOSTIC_CASES)[number]['id'];

const CASE_ACCENT_STYLES = {
  emerald: {
    panel: 'border-emerald-500/20 bg-emerald-500/10',
    soft: 'border-emerald-500/20 bg-emerald-500/[0.08]',
    chip: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
  },
  amber: {
    panel: 'border-amber-500/20 bg-amber-500/10',
    soft: 'border-amber-500/20 bg-amber-500/[0.08]',
    chip: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    text: 'text-amber-300',
    bar: 'bg-amber-400',
  },
  cyan: {
    panel: 'border-cyan-500/20 bg-cyan-500/10',
    soft: 'border-cyan-500/20 bg-cyan-500/[0.08]',
    chip: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
    text: 'text-cyan-300',
    bar: 'bg-cyan-400',
  },
  rose: {
    panel: 'border-rose-500/20 bg-rose-500/10',
    soft: 'border-rose-500/20 bg-rose-500/[0.08]',
    chip: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
    text: 'text-rose-300',
    bar: 'bg-rose-400',
  },
  violet: {
    panel: 'border-violet-500/20 bg-violet-500/10',
    soft: 'border-violet-500/20 bg-violet-500/[0.08]',
    chip: 'border-violet-500/25 bg-violet-500/10 text-violet-200',
    text: 'text-violet-300',
    bar: 'bg-violet-400',
  },
} as const;

const OBSERVATION_TONE_STYLES = {
  emerald: {
    panel: 'border-emerald-500/20 bg-emerald-500/10',
    bar: 'bg-emerald-400',
  },
  amber: {
    panel: 'border-amber-500/20 bg-amber-500/10',
    bar: 'bg-amber-400',
  },
  cyan: {
    panel: 'border-cyan-500/20 bg-cyan-500/10',
    bar: 'bg-cyan-400',
  },
  rose: {
    panel: 'border-rose-500/20 bg-rose-500/10',
    bar: 'bg-rose-400',
  },
  violet: {
    panel: 'border-violet-500/20 bg-violet-500/10',
    bar: 'bg-violet-400',
  },
} as const;

function pick(language: 'en' | 'es', text: { en: string; es: string }) {
  return language === 'es' ? text.es : text.en;
}

function caseIcon(caseId: (typeof TEMPDB_IO_DIAGNOSTIC_CASES)[number]['id']) {
  if (caseId === 'metadata' || caseId === 'version-store') return Database;
  if (caseId === 'writelog' || caseId === 'checkpoint') return HardDrive;
  if (caseId === 'spill' || caseId === 'memory') return Zap;
  return Activity;
}

function observationBarWidth(tone: keyof typeof OBSERVATION_TONE_STYLES) {
  if (tone === 'rose') return '90%';
  if (tone === 'amber') return '72%';
  if (tone === 'violet') return '64%';
  if (tone === 'cyan') return '58%';
  return '36%';
}

function isDiagnosticCaseId(value: string): value is DiagnosticCaseId {
  return TEMPDB_IO_DIAGNOSTIC_CASES.some((scenario) => scenario.id === value);
}

export function IncidentDecisionLab() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [activeDiagnosticId, setActiveDiagnosticId] = useState<DiagnosticCaseId>('metadata');
  const [selectedDiagnosticChoiceId, setSelectedDiagnosticChoiceId] = useState<string | null>(null);

  const activeDiagnostic =
    TEMPDB_IO_DIAGNOSTIC_CASES.find((scenario) => scenario.id === activeDiagnosticId) ??
    TEMPDB_IO_DIAGNOSTIC_CASES[0];

  useEffect(() => {
    setSelectedDiagnosticChoiceId(null);
  }, [activeDiagnosticId]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'intro' || mode === 'play') {
      setViewMode(mode);
    }
  }, [searchParams]);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view && isDiagnosticCaseId(view)) {
      setActiveDiagnosticId(view);
    }
  }, [searchParams]);

  const selectedDiagnosticChoice =
    activeDiagnostic.choices.find((choice) => choice.id === selectedDiagnosticChoiceId) ?? null;
  const correctDiagnosticChoice =
    activeDiagnostic.choices.find((choice) => choice.id === activeDiagnostic.correctChoiceId) ??
    activeDiagnostic.choices[0];
  const diagnosticAccent = CASE_ACCENT_STYLES[activeDiagnostic.accent];
  const isCorrectDiagnosticChoice = selectedDiagnosticChoiceId === activeDiagnostic.correctChoiceId;
  const Icon = caseIcon(activeDiagnostic.id);

  const casePreview = useMemo(
    () =>
      TEMPDB_IO_DIAGNOSTIC_CASES.map((scenario) => ({
        ...scenario,
        preview: scenario.observations.slice(0, 2),
      })),
    []
  );

  const flowLabels = [
    {
      title: { en: 'Observe', es: 'Observa' },
      detail: { en: 'Read the signal on screen.', es: 'Lee la señal en pantalla.' },
    },
    {
      title: { en: 'Decide', es: 'Decide' },
      detail: { en: 'Pick the strongest suspicion.', es: 'Elige la sospecha más fuerte.' },
    },
    {
      title: { en: 'Prove', es: 'Prueba' },
      detail: { en: 'Run the right T-SQL now.', es: 'Lanza ahora el T-SQL correcto.' },
    },
    {
      title: { en: 'Act', es: 'Actúa' },
      detail: { en: 'Take the safe next DBA step.', es: 'Da el siguiente paso DBA seguro.' },
    },
  ];

  const flowIndex = selectedDiagnosticChoiceId === null ? 1 : isCorrectDiagnosticChoice ? 3 : 2;

  if (viewMode === 'intro') {
    return (
      <div className="flex min-h-full flex-col gap-5">
        <div className="glass-panel relative overflow-hidden border border-white/10 p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.1),transparent_30%)]" />
          <div className="relative z-10 max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
              <FlaskConical className="h-3.5 w-3.5" />
              {language === 'es' ? 'Laboratorios guiados' : 'Guided labs'}
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {language === 'es'
                ? 'Aprende a pensar como un DBA en medio de la incidencia'
                : 'Learn to think like a DBA in the middle of the incident'}
            </h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/78 sm:text-[15px]">
              {language === 'es'
                ? 'Primero ves qué síntoma vas a perseguir. Luego entras en una vista de trabajo grande para quedarte solo con señales, decisión, query y siguiente paso.'
                : 'See the symptom first. Then enter a large working view that keeps only signals, decision, query, and the next step.'}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: language === 'es' ? 'Lo que entra' : 'What enters',
                  body:
                    language === 'es'
                      ? 'Un síntoma creíble: TempDB, log, memoria, caché fría o ráfagas de checkpoint.'
                      : 'A believable symptom: TempDB, log, memory, cold cache, or checkpoint bursts.',
                },
                {
                  title: language === 'es' ? 'Lo que decides' : 'What you decide',
                  body:
                    language === 'es'
                      ? 'No el fix todavía. Primero la sospecha más fuerte con la evidencia mínima.'
                      : 'Not the fix yet. First the strongest suspicion with the minimum evidence.',
                },
                {
                  title: language === 'es' ? 'Lo que valida el DBA' : 'What the DBA validates',
                  body:
                    language === 'es'
                      ? 'La query exacta, el patrón real y el siguiente movimiento seguro.'
                      : 'The exact query, the real pattern, and the next safe move.',
                },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">{card.title}</div>
                  <p className="mt-2 text-sm leading-7 text-white/74">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {casePreview.map((scenario) => {
              const isActive = scenario.id === activeDiagnostic.id;
              const ScenarioIcon = caseIcon(scenario.id);
              const accent = CASE_ACCENT_STYLES[scenario.accent];

              return (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setActiveDiagnosticId(scenario.id);
                    setViewMode('play');
                  }}
                  className={cn(
                    'rounded-3xl border p-4 text-left transition-all',
                    isActive
                      ? `${accent.panel} shadow-[0_18px_50px_rgba(0,0,0,0.22)]`
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                        <ScenarioIcon className={cn('h-4 w-4', isActive ? accent.text : 'text-white/55')} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-white">{pick(language, scenario.title)}</div>
                        <p className="mt-1 text-xs leading-6 text-white/58">{pick(language, scenario.summary)}</p>
                      </div>
                    </div>
                    <ArrowRight className={cn('h-4 w-4 shrink-0', isActive ? accent.text : 'text-white/35')} />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {scenario.preview.map((item) => (
                      <div
                        key={`${scenario.id}-${pick(language, item.label)}`}
                        className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                          {pick(language, item.label)}
                        </div>
                        <div className="mt-1 text-sm font-black text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="glass-panel rounded-3xl border border-white/10 p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Cómo se juega' : 'How it works'}
            </div>
            <div className="mt-4 space-y-3">
              {flowLabels.map((step, index) => (
                <div key={step.title.en} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs font-black text-white/75">
                      0{index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{pick(language, step.title)}</div>
                      <div className="text-xs leading-6 text-white/58">{pick(language, step.detail)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setViewMode('play')}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-500/30 bg-teal-500/15 px-5 py-3 text-sm font-black text-teal-100 transition-all hover:bg-teal-500/25"
            >
              <Play className="h-4 w-4" />
              {language === 'es' ? 'Entrar en Play' : 'Enter Play'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4 lg:h-[calc(100dvh-10.5rem)]">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          {TEMPDB_IO_DIAGNOSTIC_CASES.map((scenario) => {
            const ScenarioIcon = caseIcon(scenario.id);
            const isActive = scenario.id === activeDiagnostic.id;
            const accent = CASE_ACCENT_STYLES[scenario.accent];

            return (
              <button
                key={scenario.id}
                onClick={() => setActiveDiagnosticId(scenario.id)}
                className={cn(
                  'flex w-full items-center justify-start gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all sm:w-auto',
                  isActive
                    ? `${accent.soft} border border-white/15 text-white`
                    : 'border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                <ScenarioIcon className={cn('h-4 w-4', isActive ? accent.text : 'text-white/45')} />
                {pick(language, scenario.title)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDiagnosticChoiceId(null)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
            {language === 'es' ? 'Reiniciar' : 'Reset'}
          </button>
          <button
            onClick={() => setViewMode('intro')}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {language === 'es' ? 'Descripción' : 'Description'}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.18fr)_340px]">
        <div className="glass-panel min-h-0 overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-5">
          <div className={cn('rounded-3xl border p-5', diagnosticAccent.panel)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className={cn('text-[11px] font-black uppercase tracking-[0.22em]', diagnosticAccent.text)}>
                  {language === 'es' ? 'Caso activo' : 'Active case'}
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <Icon className={cn('h-5 w-5', diagnosticAccent.text)} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black text-white">{pick(language, activeDiagnostic.title)}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-white/82">{pick(language, activeDiagnostic.question)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeDiagnostic.badges.map((badge) => (
                  <span
                    key={`${activeDiagnostic.id}-${badge}`}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]',
                      diagnosticAccent.chip
                    )}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {flowLabels.map((step, index) => {
                const isCurrent = index === flowIndex;
                const isPast = index < flowIndex;
                return (
                  <div
                    key={`${activeDiagnostic.id}-${step.title.en}`}
                    className={cn(
                      'rounded-2xl border p-3 transition-all',
                      isCurrent
                        ? `${diagnosticAccent.soft} border-white/15`
                        : isPast
                        ? 'border-white/15 bg-white/[0.06]'
                        : 'border-white/10 bg-black/20'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">0{index + 1}</span>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]',
                          isCurrent
                            ? diagnosticAccent.chip
                            : isPast
                            ? 'border-white/10 bg-black/20 text-white/55'
                            : 'border-white/10 bg-black/20 text-white/35'
                        )}
                      >
                        {isCurrent ? (language === 'es' ? 'ahora' : 'now') : isPast ? 'ok' : language === 'es' ? 'lista' : 'ready'}
                      </span>
                    </div>
                    <div className="mt-3 text-sm font-black text-white">{pick(language, step.title)}</div>
                    <p className="mt-1 text-xs leading-6 text-white/58">{pick(language, step.detail)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.03fr)_minmax(300px,0.97fr)]">
            <div className="flex min-h-0 flex-col gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                  <Activity className="h-4 w-4 text-teal-300" />
                  {language === 'es' ? 'Señales en pantalla' : 'Signals on screen'}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {activeDiagnostic.observations.map((observation) => {
                    const tone = OBSERVATION_TONE_STYLES[observation.tone];
                    return (
                      <div
                        key={`${activeDiagnostic.id}-${pick(language, observation.label)}`}
                        className={cn('rounded-3xl border p-4', tone.panel)}
                      >
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                          {pick(language, observation.label)}
                        </div>
                        <div className="mt-3 text-xl font-black text-white">{observation.value}</div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: observationBarWidth(observation.tone) }}
                            transition={{ duration: 0.5 }}
                            className={cn('h-full rounded-full', tone.bar)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeDiagnostic.id}-${selectedDiagnosticChoiceId ?? 'idle'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={cn(
                    'rounded-3xl border p-5',
                    selectedDiagnosticChoice
                      ? isCorrectDiagnosticChoice
                        ? 'border-emerald-500/20 bg-emerald-500/10'
                        : 'border-amber-500/20 bg-amber-500/10'
                      : 'border-white/10 bg-black/20'
                  )}
                >
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em]">
                    {selectedDiagnosticChoice ? (
                      isCorrectDiagnosticChoice ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-300" />
                      )
                    ) : (
                      <CircleHelp className="h-4 w-4 text-white/45" />
                    )}
                    <span
                      className={
                        selectedDiagnosticChoice
                          ? isCorrectDiagnosticChoice
                            ? 'text-emerald-300'
                            : 'text-amber-300'
                          : 'text-white/45'
                      }
                    >
                      {selectedDiagnosticChoice
                        ? isCorrectDiagnosticChoice
                          ? language === 'es'
                            ? 'Lectura correcta'
                            : 'Correct read'
                          : language === 'es'
                          ? 'Ajusta la sospecha'
                          : 'Adjust the suspicion'
                        : language === 'es'
                        ? 'Todavía no has decidido'
                        : 'No decision yet'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-white/82">
                    {selectedDiagnosticChoice
                      ? pick(language, activeDiagnostic.diagnosis)
                      : language === 'es'
                      ? 'Elige primero la sospecha más fuerte. Después verás si la ruta DBA y la query encajan con ese patrón.'
                      : 'Pick the strongest suspicion first. Then check whether the DBA route and query fit that pattern.'}
                  </p>

                  {selectedDiagnosticChoice && !isCorrectDiagnosticChoice ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                        {language === 'es' ? 'La opción fuerte era' : 'Best option was'}
                      </div>
                      <div className="mt-2 text-sm font-black text-white">{pick(language, correctDiagnosticChoice.label)}</div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex min-h-0 flex-col gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                  <CircleHelp className="h-4 w-4 text-amber-300" />
                  {language === 'es' ? 'Tu decisión' : 'Your decision'}
                </div>

                <div className="mt-4 grid gap-3">
                  {activeDiagnostic.choices.map((choice, index) => {
                    const isSelected = selectedDiagnosticChoiceId === choice.id;
                    const isCorrect = choice.id === activeDiagnostic.correctChoiceId;
                    const hasAnswered = selectedDiagnosticChoiceId !== null;

                    return (
                      <button
                        key={`${activeDiagnostic.id}-${choice.id}`}
                        onClick={() => setSelectedDiagnosticChoiceId(choice.id)}
                        className={cn(
                          'rounded-3xl border p-4 text-left transition-all',
                          !hasAnswered && 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]',
                          hasAnswered && isCorrect && 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
                          hasAnswered && isSelected && !isCorrect && 'border-rose-500/25 bg-rose-500/10 text-rose-100',
                          hasAnswered && !isSelected && !isCorrect && 'border-white/10 bg-black/15 text-white/42'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-black">{pick(language, choice.label)}</span>
                          <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-black text-white/60">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/74">
                          {hasAnswered
                            ? pick(language, choice.explanation)
                            : language === 'es'
                            ? 'Toca para apostar por esta línea de investigación.'
                            : 'Tap to bet on this line of investigation.'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                  <Search className="h-4 w-4 text-violet-300" />
                  {language === 'es' ? 'Query que lanzas ahora' : 'Query to run now'}
                </div>
                <div className="mt-4">
                  <CopyCodeBlock code={activeDiagnostic.query} accent={activeDiagnostic.accent} contentClassName="max-h-[220px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel min-h-0 overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-5">
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <div className={cn('rounded-3xl border p-5', diagnosticAccent.soft)}>
              <div className={cn('text-[11px] font-black uppercase tracking-[0.22em]', diagnosticAccent.text)}>
                {language === 'es' ? 'Ruta DBA' : 'DBA route'}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/82">{pick(language, activeDiagnostic.dbaFocus)}</p>
            </div>

            <div className="space-y-3">
              {activeDiagnostic.dbaActions.map((action, index) => (
                <div key={`${activeDiagnostic.id}-action-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black', diagnosticAccent.chip)}>
                      0{index + 1}
                    </div>
                    <p className="text-sm leading-7 text-white/76">{pick(language, action)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                {language === 'es' ? 'Después de probarlo' : 'After proving it'}
              </div>
              <div className="mt-3 space-y-3">
                {activeDiagnostic.followUp.map((item, index) => (
                  <div key={`${activeDiagnostic.id}-follow-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-7 text-white/75">
                    {pick(language, item)}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-amber-200/80">
                <ShieldAlert className="h-4 w-4" />
                {language === 'es' ? 'Cuidado' : 'Caution'}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/82">{pick(language, activeDiagnostic.caution)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
