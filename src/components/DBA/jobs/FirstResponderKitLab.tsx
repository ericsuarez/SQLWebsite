import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, Database, Filter, TerminalSquare } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { BLITZ_FINDINGS, BLITZCACHE_ROWS, JOB_TSQL_SNIPPETS, type FindingSeverity } from '../../../data/industryJobsData';
import { cn } from '../../../lib/utils';
import { CopyCodeBlock } from '../../Shared/CopyCodeBlock';
import { DBAActionBoard } from '../../Shared/DBAActionBoard';
import { GuidedLabPanel } from '../../Shared/GuidedLabPanel';

const SEVERITY_STYLE: Record<FindingSeverity, { chip: string; row: string }> = {
  critical: {
    chip: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
    row: 'hover:bg-rose-500/5',
  },
  warning: {
    chip: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    row: 'hover:bg-amber-500/5',
  },
  info: {
    chip: 'border-sky-500/25 bg-sky-500/10 text-sky-200',
    row: 'hover:bg-sky-500/5',
  },
  good: {
    chip: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
    row: 'hover:bg-emerald-500/5',
  },
};

const GUIDE_STEPS = [
  {
    title: { en: 'Run the broad triage first', es: 'Empieza con el triaje amplio' },
    detail: {
      en: 'sp_Blitz is for finding where the fire is. Do not jump to tuning before you know the class of problem.',
      es: 'sp_Blitz sirve para saber dónde está el fuego. No saltes al tuning sin saber primero de qué clase de problema hablas.',
    },
  },
  {
    title: { en: 'Prioritize by severity', es: 'Prioriza por severidad' },
    detail: {
      en: 'Critical and warning findings tell you where to spend time first. Good findings are baseline, not action items.',
      es: 'Los hallazgos critical y warning te dicen dónde gastar tiempo primero. Los good son baseline, no acción inmediata.',
    },
  },
  {
    title: { en: 'Move into plan cache evidence', es: 'Baja a la evidencia de plan cache' },
    detail: {
      en: 'sp_BlitzCache is where you connect the health check to a concrete query, plan and resource pattern.',
      es: 'sp_BlitzCache es donde conectas el health check con una query concreta, su plan y su patrón de consumo.',
    },
  },
  {
    title: { en: 'Validate with SQL before changing anything', es: 'Valida con SQL antes de tocar nada' },
    detail: {
      en: 'The lab is complete only when you can explain the why and show the supporting DMV or script.',
      es: 'El lab no termina hasta que sabes explicar el por qué y mostrar la DMV o el script que lo demuestra.',
    },
  },
] as const;

function pick(language: 'en' | 'es', text: { en: string; es: string }) {
  return language === 'es' ? text.es : text.en;
}

interface FirstResponderKitLabProps {
  compact?: boolean;
}

export function FirstResponderKitLab({ compact = false }: FirstResponderKitLabProps) {
  const { language } = useLanguage();
  const [tool, setTool] = useState<'blitz' | 'cache'>('blitz');
  const [severity, setSeverity] = useState<'all' | FindingSeverity>('all');
  const [selectedId, setSelectedId] = useState<string>(() => BLITZ_FINDINGS[0]?.id ?? 'poison_wait');

  const rows = useMemo(() => {
    const list = tool === 'blitz' ? BLITZ_FINDINGS : BLITZCACHE_ROWS;
    if (severity === 'all') return list;
    return list.filter((item) => item.severity === severity);
  }, [severity, tool]);

  const selected = useMemo(() => {
    const list = tool === 'blitz' ? BLITZ_FINDINGS : BLITZCACHE_ROWS;
    return list.find((item) => item.id === selectedId) ?? list[0];
  }, [selectedId, tool]);

  const guideStep = tool === 'cache' ? (severity === 'all' ? 2 : 3) : severity === 'all' ? 0 : 1;
  const dbaFocus =
    tool === 'blitz'
      ? {
          en: 'This is triage, not final diagnosis. The DBA now decides whether the finding is root cause, symptom, or baseline noise.',
          es: 'Esto es triaje, no diagnostico final. Ahora el DBA decide si el hallazgo es causa raiz, sintoma o ruido de baseline.',
        }
      : {
          en: 'Now the DBA must connect the cache row to one concrete query shape, one resource pattern, and one safe next action.',
          es: 'Ahora el DBA debe conectar la fila de cache con una forma concreta de query, un patron de recurso y una siguiente accion segura.',
        };

  const dbaActions =
    tool === 'blitz'
      ? [
          {
            en: 'Validate the finding with the supporting DMV or script before changing any server-wide setting.',
            es: 'Valida el hallazgo con la DMV o script de soporte antes de cambiar nada global en el servidor.',
          },
          {
            en: 'Decide whether it points to CPU, waits, memory, backups or plan volatility, then narrow to one workload.',
            es: 'Decide si apunta a CPU, waits, memoria, backups o volatilidad de planes y luego baja a una sola carga.',
          },
          {
            en: 'Document whether this is a one-off alert or something that deserves a permanent runbook.',
            es: 'Documenta si es una alerta puntual o algo que merece un runbook permanente.',
          },
        ]
      : [
          {
            en: 'Open the plan or Query Store evidence for this query before you touch indexes or hints.',
            es: 'Abre el plan o la evidencia de Query Store de esta query antes de tocar indices o hints.',
          },
          {
            en: 'Check if the pain is reads, CPU, lookups, implicit conversions or memory grant shape.',
            es: 'Revisa si el dolor viene de lecturas, CPU, lookups, conversiones implicitas o forma del memory grant.',
          },
          {
            en: 'Pick the smallest safe mitigation first: fix types, cover the lookup, or stabilize the plan.',
            es: 'Elige primero la mitigacion segura mas pequena: arreglar tipos, cubrir el lookup o estabilizar el plan.',
          },
        ];

  return (
    <div className={cn('grid gap-4 lg:gap-6 h-full', compact ? 'xl:grid-cols-[minmax(0,1.08fr)_340px]' : 'xl:grid-cols-[minmax(0,1.2fr)_420px]')}>
      <div className={cn('glass-panel rounded-2xl border border-white/10 p-4 sm:p-6', compact && 'min-h-0 overflow-hidden flex flex-col')}>
        {!compact ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-sky-300 flex items-center gap-2">
                <TerminalSquare className="h-5 w-5" />
                {language === 'es' ? 'First Responder Kit (sp_Blitz / sp_BlitzCache)' : 'First Responder Kit (sp_Blitz / sp_BlitzCache)'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {language === 'es'
                  ? 'Simulacion estilo health-check: hallazgos con severidad, detalles clicables y T-SQL listo para copiar.'
                  : 'A health-check style simulation: severity-coded findings, clickable details and ready-to-paste T-SQL.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/70">sp_Blitz</span>
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/70">sp_BlitzCache</span>
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/70">Query Store</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
              {language === 'es' ? 'Play: consulta y hallazgos' : 'Play: query and findings'}
            </div>
            <p className="mt-2 text-xs text-white/75">
              {language === 'es'
                ? 'Selecciona un hallazgo y sigue causa -> impacto -> fix con SQL de soporte.'
                : 'Select a finding and follow cause -> impact -> fix with supporting SQL.'}
            </p>
          </div>
        )}

        {!compact ? <div className="mt-5">
          <GuidedLabPanel
            language={language}
            compact={compact}
            accent="sky"
            title={{ en: 'How to read this health check', es: 'Cómo leer este health check' }}
            objective={{
              en: 'Think like a DBA: first classify the problem, then narrow it, then prove it with evidence.',
              es: 'Piensa como un DBA: primero clasifica el problema, luego lo acotas y al final lo pruebas con evidencia.',
            }}
            watchItems={[
              {
                en: 'Severity gives you order, not the full diagnosis.',
                es: 'La severidad te da el orden, no el diagnóstico completo.',
              },
              {
                en: 'A finding only matters when you can tie it to a real query or resource pattern.',
                es: 'Un hallazgo solo importa de verdad cuando lo atas a una query real o a un patrón de recurso.',
              },
              {
                en: 'Use the SQL on the right as proof, not as decoration.',
                es: 'Usa el SQL de la derecha como prueba, no como decoración.',
              },
            ]}
            steps={GUIDE_STEPS}
            currentStep={guideStep}
            footer={{
                en: 'If you can explain why a finding is important and how you would validate it, the lab already taught the right habit.',
              es: 'Si sabes explicar por qué un hallazgo importa y cómo lo validarías, el lab ya te enseñó el hábito correcto.',
            }}
          />
        </div> : null}

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-1 lg:w-auto">
            {(
              [
                { id: 'blitz', label: 'sp_Blitz', icon: AlertTriangle },
                { id: 'cache', label: 'sp_BlitzCache', icon: Activity },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = tool === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTool(tab.id);
                    const first = tab.id === 'blitz' ? BLITZ_FINDINGS[0]?.id : BLITZCACHE_ROWS[0]?.id;
                    if (first) setSelectedId(first);
                  }}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2',
                    isActive ? 'bg-sky-500/20 text-sky-200' : 'text-white/55 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 lg:w-auto">
            <Filter className="h-4 w-4 text-white/40" />
            {(['all', 'critical', 'warning', 'info', 'good'] as const).map((id) => (
              <button
                key={id}
                onClick={() => setSeverity(id)}
                className={cn(
                  'rounded-xl px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] transition-all border',
                  severity === id
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-white/10 bg-black/20 text-white/55 hover:bg-white/5 hover:text-white'
                )}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <div className={cn('mt-6 rounded-3xl border border-white/10 bg-black/25 overflow-hidden', compact && 'min-h-0 flex-1 flex flex-col')}>
          <div className="hidden border-b border-white/10 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40 md:grid md:grid-cols-[140px_minmax(0,1fr)_120px]">
            <div>{language === 'es' ? 'Severidad' : 'Severity'}</div>
            <div>{language === 'es' ? 'Hallazgo' : 'Finding'}</div>
            <div className="text-right">{language === 'es' ? 'Badge' : 'Badge'}</div>
          </div>

          <div className={cn('divide-y divide-white/10', compact && 'min-h-0 overflow-y-auto')}>
            {rows.map((item) => {
              const isActive = item.id === selected?.id;
              const style = SEVERITY_STYLE[item.severity];
              const title =
                tool === 'blitz'
                  ? pick(language, (item as (typeof BLITZ_FINDINGS)[number]).title)
                  : (item as (typeof BLITZCACHE_ROWS)[number]).queryLabel;
              const subtitle =
                tool === 'blitz'
                  ? pick(language, (item as (typeof BLITZ_FINDINGS)[number]).summary)
                  : pick(language, (item as (typeof BLITZCACHE_ROWS)[number]).summary);

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'w-full text-left px-4 py-4 transition-colors',
                    isActive ? 'bg-white/10' : cn('bg-transparent', style.row)
                  )}
                >
                  <div className="grid items-start gap-3 md:grid-cols-[140px_minmax(0,1fr)_120px] md:gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', style.chip)}>
                        {item.severity}
                      </span>
                      <span className="inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 md:hidden">
                        {tool === 'blitz' ? (item as (typeof BLITZ_FINDINGS)[number]).badge : (item as (typeof BLITZCACHE_ROWS)[number]).database}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white md:truncate">{title}</div>
                      <div className="mt-1 text-xs leading-6 text-white/60">{subtitle}</div>
                      {tool === 'cache' && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(item as (typeof BLITZCACHE_ROWS)[number]).flags.slice(0, 3).map((flag) => (
                            <span key={flag} className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/65">
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="hidden text-right md:block">
                      <span className="inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
                        {tool === 'blitz' ? (item as (typeof BLITZ_FINDINGS)[number]).badge : (item as (typeof BLITZCACHE_ROWS)[number]).database}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={cn('glass-panel rounded-2xl border border-white/10 p-4 sm:p-6', compact && 'min-h-0 overflow-hidden flex flex-col')}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tool}-${selected?.id ?? 'none'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-sky-300" />
                {language === 'es' ? 'Detalle' : 'Details'}
              </h4>
              {selected && (
                <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', SEVERITY_STYLE[selected.severity].chip)}>
                  {selected.severity}
                </span>
              )}
            </div>

            {selected ? (
              <div className={cn('mt-4 space-y-4', compact && 'min-h-0 flex-1 overflow-y-auto pr-1')}>
                {compact ? (
                  <DBAActionBoard
                    language={language}
                    accent={tool === 'cache' ? 'violet' : 'sky'}
                    title={{ en: 'What the DBA does now', es: 'Que hace ahora el DBA' }}
                    focus={dbaFocus}
                    actions={dbaActions}
                    caution={{
                      en: 'A finding is only useful when you can prove it with live evidence or plan evidence.',
                      es: 'Un hallazgo solo sirve de verdad cuando puedes demostrarlo con evidencia en vivo o evidencia de plan.',
                    }}
                  />
                ) : null}
                {tool === 'blitz' ? (
                  <>
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                      <div className="text-sm font-bold text-white">{pick(language, (selected as (typeof BLITZ_FINDINGS)[number]).title)}</div>
                      <p className="mt-3 text-sm leading-7 text-white/75">{pick(language, (selected as (typeof BLITZ_FINDINGS)[number]).why)}</p>
                      <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                          {language === 'es' ? 'Remediacion' : 'Remediation'}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/80">{pick(language, (selected as (typeof BLITZ_FINDINGS)[number]).fix)}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(selected as (typeof BLITZ_FINDINGS)[number]).tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/70">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <CopyCodeBlock code={(selected as (typeof BLITZ_FINDINGS)[number]).tsql} accent="cyan" contentClassName={compact ? 'max-h-[220px]' : undefined} />
                    {!compact ? <CopyCodeBlock code={JOB_TSQL_SNIPPETS.blitz} accent="cyan" /> : null}
                  </>
                ) : (
                  <>
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                      <div className="text-sm font-bold text-white">{(selected as (typeof BLITZCACHE_ROWS)[number]).queryLabel}</div>
                      <p className="mt-3 text-sm leading-7 text-white/75">{pick(language, (selected as (typeof BLITZCACHE_ROWS)[number]).summary)}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          { k: 'CPU', v: `${(selected as (typeof BLITZCACHE_ROWS)[number]).cpuMs.toLocaleString()} ms` },
                          { k: 'Duration', v: `${(selected as (typeof BLITZCACHE_ROWS)[number]).durationMs.toLocaleString()} ms` },
                          { k: 'Reads', v: (selected as (typeof BLITZCACHE_ROWS)[number]).reads.toLocaleString() },
                          { k: 'Writes', v: (selected as (typeof BLITZCACHE_ROWS)[number]).writes.toLocaleString() },
                        ].map((cell) => (
                          <div key={cell.k} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{cell.k}</div>
                            <div className="mt-1 text-sm font-bold text-white">{cell.v}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
                          {language === 'es' ? 'Remediacion' : 'Remediation'}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/80">{pick(language, (selected as (typeof BLITZCACHE_ROWS)[number]).fix)}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(selected as (typeof BLITZCACHE_ROWS)[number]).flags.map((flag) => (
                          <span key={flag} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/70">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <CopyCodeBlock code={(selected as (typeof BLITZCACHE_ROWS)[number]).tsql} accent="cyan" contentClassName={compact ? 'max-h-[220px]' : undefined} />
                    {!compact ? <CopyCodeBlock code={JOB_TSQL_SNIPPETS.blitzCache} accent="blue" /> : null}
                  </>
                )}
              </div>
            ) : (
              <div className="mt-4 text-sm text-white/65">{language === 'es' ? 'Sin datos' : 'No data'}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
