import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { REAL_CASES } from '../DBA/realCasesData';
import { RealCaseScenario } from '../DBA/RealCaseScenario';

export function RealCasesPage() {
  const { t, language } = useLanguage();

  const description =
    language === 'es'
      ? 'Postmortems y escenarios de producción para leer la incidencia completa, no el drill guiado.'
      : 'Postmortems and production scenarios to read the full incident, not the guided drill.';

  const visibleCases = useMemo(
    () =>
      REAL_CASES.filter(
        (item) =>
          item.id !== 'tempdb' &&
          item.id !== 'missingindex' &&
          item.id !== 'attention' &&
          item.detectionMode !== 'xe'
      ),
    []
  );

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="glass-panel border border-white/10 p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h2 className="flex items-center gap-3 bg-gradient-to-r from-cyan-300 via-teal-300 to-lime-300 bg-clip-text text-3xl font-black text-transparent">
              <AlertTriangle className="h-7 w-7 text-cyan-300" />
              {t('realCasesTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/74">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
            {[
              {
                title: language === 'es' ? 'Contexto' : 'Context',
                body:
                  language === 'es'
                    ? 'Qué carga había, qué se rompió y dónde empezó a notarse.'
                    : 'Which workload was running, what broke, and where it first became visible.',
              },
              {
                title: language === 'es' ? 'Evidencia' : 'Evidence',
                body:
                  language === 'es'
                    ? 'DMVs, waits, plan, TempDB, log o hipervisor según el caso.'
                    : 'DMVs, waits, plan, TempDB, log, or hypervisor depending on the case.',
              },
              {
                title: language === 'es' ? 'Respuesta' : 'Response',
                body:
                  language === 'es'
                    ? 'Qué haría un DBA senior y qué no tocaría todavía.'
                    : 'What a senior DBA would do and what should stay untouched for now.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{card.title}</div>
                <p className="mt-2 text-sm leading-7 text-white/68">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <RealCaseScenario cases={visibleCases} />
      </div>
    </div>
  );
}
