import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, Database, Filter, TerminalSquare } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { BLITZ_FINDINGS, BLITZCACHE_ROWS, JOB_TSQL_SNIPPETS, type FindingSeverity } from '../../../data/industryJobsData';
import { cn } from '../../../lib/utils';
import { CopyCodeBlock } from '../../Shared/CopyCodeBlock';

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

  return (
    <div className={cn('grid gap-4 lg:gap-6', compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1.2fr)_420px]')}>
      <div className="glass-panel rounded-2xl border border-white/10 p-4 sm:p-6">
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

        <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 overflow-hidden">
          <div className="hidden border-b border-white/10 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40 md:grid md:grid-cols-[140px_minmax(0,1fr)_120px]">
            <div>{language === 'es' ? 'Severidad' : 'Severity'}</div>
            <div>{language === 'es' ? 'Hallazgo' : 'Finding'}</div>
            <div className="text-right">{language === 'es' ? 'Badge' : 'Badge'}</div>
          </div>

          <div className="divide-y divide-white/10">
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

      <div className="glass-panel rounded-2xl border border-white/10 p-4 sm:p-6">
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
              <div className="mt-4 space-y-4">
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
                    <CopyCodeBlock code={(selected as (typeof BLITZ_FINDINGS)[number]).tsql} accent="cyan" />
                    <CopyCodeBlock code={JOB_TSQL_SNIPPETS.blitz} accent="cyan" />
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
                    <CopyCodeBlock code={(selected as (typeof BLITZCACHE_ROWS)[number]).tsql} accent="cyan" />
                    <CopyCodeBlock code={JOB_TSQL_SNIPPETS.blitzCache} accent="blue" />
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
