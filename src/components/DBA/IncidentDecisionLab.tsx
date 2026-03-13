import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Database,
  HardDrive,
  RotateCcw,
  Search,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TEMPDB_IO_DIAGNOSTIC_CASES } from '../../data/tempdbIoPlaybooks';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const CASE_ACCENT_STYLES = {
  emerald: {
    wrap: 'border-emerald-500/20 bg-emerald-500/10',
    chip: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
    text: 'text-emerald-300',
  },
  amber: {
    wrap: 'border-amber-500/20 bg-amber-500/10',
    chip: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    text: 'text-amber-300',
  },
  cyan: {
    wrap: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
    chip: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
    text: 'text-cyan-300',
  },
  rose: {
    wrap: 'border-rose-500/20 bg-rose-500/10',
    chip: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
    text: 'text-rose-300',
  },
  violet: {
    wrap: 'border-violet-500/20 bg-violet-500/10',
    chip: 'border-violet-500/25 bg-violet-500/10 text-violet-200',
    text: 'text-violet-300',
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
  if (tone === 'rose') return '92%';
  if (tone === 'amber') return '72%';
  if (tone === 'violet') return '64%';
  if (tone === 'cyan') return '58%';
  return '34%';
}

export function IncidentDecisionLab() {
  const { language } = useLanguage();
  const [activeDiagnosticId, setActiveDiagnosticId] = useState<
    (typeof TEMPDB_IO_DIAGNOSTIC_CASES)[number]['id']
  >('metadata');
  const [selectedDiagnosticChoiceId, setSelectedDiagnosticChoiceId] = useState<string | null>(null);

  const activeDiagnostic =
    TEMPDB_IO_DIAGNOSTIC_CASES.find((scenario) => scenario.id === activeDiagnosticId) ??
    TEMPDB_IO_DIAGNOSTIC_CASES[0];

  useEffect(() => {
    setSelectedDiagnosticChoiceId(null);
  }, [activeDiagnosticId]);

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

  return (
    <div className="glass-panel rounded-3xl border border-white/10 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
            {language === 'es' ? 'Decision Lab' : 'Decision Lab'}
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            {language === 'es'
              ? 'Decide, valida y actua como un DBA'
              : 'Decide, validate, and act like a DBA'}
          </h3>
          <p className="mt-2 text-sm leading-7 text-white/72">
            {language === 'es'
              ? 'Solo tres cosas: que esta pasando, con que lo pruebas y que haces despues.'
              : 'Only three things matter here: what is happening, how you prove it, and what you do next.'}
          </p>
        </div>

        <button
          onClick={() => setSelectedDiagnosticChoiceId(null)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {language === 'es' ? 'Reset caso' : 'Reset case'}
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-3">
          {casePreview.map((scenario) => {
            const isActive = scenario.id === activeDiagnostic.id;
            const ScenarioIcon = caseIcon(scenario.id);
            const accent = CASE_ACCENT_STYLES[scenario.accent];

            return (
              <button
                key={scenario.id}
                onClick={() => setActiveDiagnosticId(scenario.id)}
                className={cn(
                  'w-full rounded-3xl border p-4 text-left transition-all',
                  isActive
                    ? `${accent.wrap} shadow-[0_0_28px_rgba(34,211,238,0.08)]`
                    : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <ScenarioIcon className={cn('h-4 w-4', isActive ? accent.text : 'text-white/55')} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{pick(language, scenario.title)}</div>
                      <p className="mt-1 text-xs leading-6 text-white/60">{pick(language, scenario.summary)}</p>
                    </div>
                  </div>
                  <ArrowRight className={cn('mt-1 h-4 w-4', isActive ? accent.text : 'text-white/35')} />
                </div>

                <div className="mt-3 grid gap-2">
                  {scenario.preview.map((item) => (
                    <div
                      key={`${scenario.id}-${pick(language, item.label)}`}
                      className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                        {pick(language, item.label)}
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_340px]">
          <div className="space-y-4">
            <div className={cn('rounded-3xl border p-5', diagnosticAccent.wrap)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <Icon className={cn('h-5 w-5', diagnosticAccent.text)} />
                  </div>
                  <div className="min-w-0">
                    <div className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', diagnosticAccent.text)}>
                      {language === 'es' ? 'Caso activo' : 'Active case'}
                    </div>
                    <h4 className="mt-1 text-xl font-black text-white">{pick(language, activeDiagnostic.title)}</h4>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeDiagnostic.badges.slice(0, 3).map((badge) => (
                    <span
                      key={`${activeDiagnostic.id}-${badge}`}
                      className={cn(
                        'rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]',
                        diagnosticAccent.chip
                      )}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/42">
                    {language === 'es' ? 'Pregunta' : 'Question'}
                  </div>
                  <p className="mt-2 text-base font-semibold leading-7 text-white">
                    {pick(language, activeDiagnostic.question)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/42">
                    {language === 'es' ? 'Sospecha inicial' : 'Initial suspicion'}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/78">
                    {pick(language, activeDiagnostic.suspicion)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">
                <Activity className="h-4 w-4 text-cyan-300" />
                {language === 'es' ? 'Senales en pantalla' : 'Signals on screen'}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {activeDiagnostic.observations.map((observation) => {
                  const tone = OBSERVATION_TONE_STYLES[observation.tone];
                  return (
                    <div
                      key={`${activeDiagnostic.id}-${pick(language, observation.label)}`}
                      className={cn('rounded-3xl border p-4', tone.panel)}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                        {pick(language, observation.label)}
                      </div>
                      <div className="mt-3 text-lg font-black text-white">{observation.value}</div>
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

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">
                <CircleHelp className="h-4 w-4 text-amber-300" />
                {language === 'es' ? 'Tu decision' : 'Your decision'}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
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
                        hasAnswered && !isSelected && !isCorrect && 'border-white/10 bg-black/15 text-white/40'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black">{pick(language, choice.label)}</span>
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white/60">
                          0{index + 1}
                        </span>
                      </div>

                      {hasAnswered ? (
                        <p className="mt-3 text-sm leading-7 text-white/75">{pick(language, choice.explanation)}</p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selectedDiagnosticChoice ? (
                <motion.div
                  key={`${activeDiagnostic.id}-${selectedDiagnosticChoice.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={cn(
                    'rounded-3xl border p-5',
                    isCorrectDiagnosticChoice
                      ? 'border-emerald-500/20 bg-emerald-500/10'
                      : 'border-amber-500/20 bg-amber-500/10'
                  )}
                >
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]">
                    {isCorrectDiagnosticChoice ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-amber-300" />
                    )}
                    <span className={isCorrectDiagnosticChoice ? 'text-emerald-300' : 'text-amber-300'}>
                      {isCorrectDiagnosticChoice
                        ? language === 'es'
                          ? 'Buena lectura'
                          : 'Good read'
                        : language === 'es'
                          ? 'Ajusta la sospecha'
                          : 'Adjust the suspicion'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-white/85">{pick(language, activeDiagnostic.diagnosis)}</p>

                  {!isCorrectDiagnosticChoice ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                        {language === 'es' ? 'La opcion fuerte era' : 'Best option was'}
                      </div>
                      <div className="mt-2 text-sm font-bold text-white">
                        {pick(language, correctDiagnosticChoice.label)}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">
                <Search className="h-4 w-4 text-cyan-300" />
                {language === 'es' ? 'Ruta DBA' : 'DBA route'}
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                    01 {language === 'es' ? 'Enfoque' : 'Focus'}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/80">{pick(language, activeDiagnostic.dbaFocus)}</p>
                </div>

                {activeDiagnostic.dbaActions.map((action, index) => (
                  <div key={`${activeDiagnostic.id}-action-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                      {`0${index + 2}`} {language === 'es' ? 'Paso' : 'Step'}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/76">{pick(language, action)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">
                <Search className="h-4 w-4 text-violet-300" />
                {language === 'es' ? 'T-SQL que lanza ahora' : 'T-SQL to run now'}
              </div>
              <div className="mt-4">
                <CopyCodeBlock code={activeDiagnostic.query} accent={activeDiagnostic.accent} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">
                <ShieldAlert className="h-4 w-4 text-amber-300" />
                {language === 'es' ? 'Despues de la prueba' : 'After the proof'}
              </div>

              <div className="mt-4 grid gap-3">
                {activeDiagnostic.followUp.slice(0, 2).map((item, index) => (
                  <div key={`${activeDiagnostic.id}-follow-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                      {language === 'es' ? `Paso ${index + 1}` : `Step ${index + 1}`}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/76">{pick(language, item)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
