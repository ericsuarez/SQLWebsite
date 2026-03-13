import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TEMPDB_IO_DIAGNOSTIC_CASES } from '../../data/tempdbIoPlaybooks';
import { cn } from '../../lib/utils';
import { DBAActionBoard } from '../Shared/DBAActionBoard';
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
    wrap: 'border-cyan-500/20 bg-cyan-500/10',
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
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
  rose: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
} as const;

function pick(language: 'en' | 'es', text: { en: string; es: string }) {
  return language === 'es' ? text.es : text.en;
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

  return (
    <div className="glass-panel rounded-3xl border border-white/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
            {language === 'es' ? 'Laboratorio de decision DBA' : 'DBA decision lab'}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            {language === 'es'
              ? 'Pasa esto: decide que sospechas, mira la evidencia y luego lanza la query correcta'
              : 'This happens: pick your suspicion, read the evidence, then launch the right query'}
          </h3>
          <p className="mt-3 max-w-5xl text-sm leading-7 text-white/75">
            {language === 'es'
              ? 'La idea no es memorizar una query suelta. La idea es pensar como un DBA: sintoma, evidencia, confirmacion y siguiente paso seguro.'
              : 'The goal is not to memorize one isolated query. The goal is to think like a DBA: symptom, evidence, confirmation, and safe next step.'}
          </p>
        </div>

        <button
          onClick={() => setSelectedDiagnosticChoiceId(null)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {language === 'es' ? 'Reintentar caso' : 'Retry case'}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TEMPDB_IO_DIAGNOSTIC_CASES.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setActiveDiagnosticId(scenario.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-bold transition-all',
              activeDiagnosticId === scenario.id
                ? diagnosticAccent.chip
                : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
            )}
          >
            {pick(language, scenario.title)}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="space-y-4">
          <div className={cn('rounded-3xl border p-5', diagnosticAccent.wrap)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', diagnosticAccent.text)}>
                  {language === 'es' ? 'Caso activo' : 'Active case'}
                </div>
                <h4 className="mt-2 text-xl font-bold text-white">{pick(language, activeDiagnostic.title)}</h4>
                <p className="mt-3 text-sm leading-7 text-white/85">{pick(language, activeDiagnostic.question)}</p>
                <p className="mt-2 text-sm leading-7 text-white/70">{pick(language, activeDiagnostic.summary)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeDiagnostic.badges.map((badge) => (
                  <span
                    key={`${activeDiagnostic.id}-${badge}`}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]',
                      diagnosticAccent.chip
                    )}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                {language === 'es' ? 'Lo que sospecha el DBA' : 'What the DBA suspects'}
              </div>
              <p className="mt-2 text-sm leading-7 text-white/80">{pick(language, activeDiagnostic.suspicion)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {activeDiagnostic.observations.map((observation) => (
              <div
                key={`${activeDiagnostic.id}-${pick(language, observation.label)}`}
                className={cn('rounded-3xl border p-4', OBSERVATION_TONE_STYLES[observation.tone])}
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  {pick(language, observation.label)}
                </div>
                <div className="mt-3 text-lg font-bold text-white">{observation.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Que crees que esta pasando' : 'What do you think is happening'}
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {activeDiagnostic.choices.map((choice) => {
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
                      hasAnswered && !isSelected && !isCorrect && 'border-white/10 bg-black/15 text-white/45'
                    )}
                  >
                    <div className="text-sm font-bold">{pick(language, choice.label)}</div>
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
                <div
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-[0.22em]',
                    isCorrectDiagnosticChoice ? 'text-emerald-300' : 'text-amber-300'
                  )}
                >
                  {isCorrectDiagnosticChoice
                    ? language === 'es'
                      ? 'Buena sospecha'
                      : 'Good suspicion'
                    : language === 'es'
                      ? 'Ajuste de sospecha'
                      : 'Adjust the suspicion'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/85">{pick(language, activeDiagnostic.diagnosis)}</p>
                {!isCorrectDiagnosticChoice ? (
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    {language === 'es'
                      ? `La opcion mas fuerte aqui era: ${pick(language, correctDiagnosticChoice.label)}.`
                      : `The strongest option here was: ${pick(language, correctDiagnosticChoice.label)}.`}
                  </p>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <DBAActionBoard
            language={language}
            accent={activeDiagnostic.accent}
            title={{ en: 'What the DBA does now', es: 'Que hace ahora el DBA' }}
            focus={activeDiagnostic.dbaFocus}
            actions={activeDiagnostic.dbaActions}
            caution={activeDiagnostic.caution}
          />

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Query para confirmarlo' : 'Query to confirm it'}
            </div>
            <div className="mt-4">
              <CopyCodeBlock code={activeDiagnostic.query} accent={activeDiagnostic.accent} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Siguiente paso' : 'Next step'}
            </div>
            <div className="mt-4 space-y-3">
              {activeDiagnostic.followUp.map((item, index) => (
                <div key={`${activeDiagnostic.id}-follow-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                    {language === 'es' ? `Paso ${index + 1}` : `Step ${index + 1}`}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/75">{pick(language, item)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
