import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Database, HardDrive, Layers, ShieldAlert, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  IO_WRITER_PROFILES,
  TEMPDB_ALLOCATION_PAGES,
  TEMPDB_IO_TSQL,
  TEMPDB_LAYOUT_SCENARIOS,
  type LocalizedText,
} from '../../data/advancedSQLData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

export function TempDBAndIO() {
  const { language, t } = useLanguage();
  const [activePageId, setActivePageId] = useState<'pfs' | 'gam' | 'sgam'>('pfs');
  const [activeLayoutId, setActiveLayoutId] = useState<'single' | 'multiple'>('multiple');
  const [activeWriterId, setActiveWriterId] = useState<'checkpoint' | 'lazy-writer'>('checkpoint');

  const activePage = TEMPDB_ALLOCATION_PAGES.find((page) => page.id === activePageId) ?? TEMPDB_ALLOCATION_PAGES[0];
  const activeLayout = TEMPDB_LAYOUT_SCENARIOS.find((scenario) => scenario.id === activeLayoutId) ?? TEMPDB_LAYOUT_SCENARIOS[1];
  const activeWriter = IO_WRITER_PROFILES.find((profile) => profile.id === activeWriterId) ?? IO_WRITER_PROFILES[0];

  const fileCards = useMemo(
    () =>
      Array.from({ length: activeLayout.files }, (_, index) => ({
        id: `tempdev${index + 1}`,
        pressure:
          activeLayout.pressure[index] ??
          activeLayout.pressure[activeLayout.pressure.length - 1] ??
          0,
      })),
    [activeLayout]
  );

  return (
    <div className="flex h-full flex-col gap-6 text-slate-200">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-5xl">
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-red-400 via-orange-300 to-blue-300 bg-clip-text text-3xl font-bold text-transparent">
              <HardDrive className="h-8 w-8 text-red-400" />
              {t('tabTempdbIo')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {language === 'es'
                ? 'Contencion clasica en TempDB, paginas PFS/GAM/SGAM y la diferencia real entre Checkpoint y Lazy Writer. Aqui se ve que paginas se calientan, como se reparte la carga entre archivos y por que no escriben por el mismo motivo.'
                : 'Classic TempDB contention, PFS/GAM/SGAM metadata pages and the real difference between Checkpoint and Lazy Writer. This module shows which pages turn hot, how multiple files spread the load and why both writers flush for different reasons.'}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
              PAGELATCH_UP
            </div>
            <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
              CHECKPOINT
            </div>
            <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
              RESOURCE_MEMPHYSICAL_LOW
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_380px]">
        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                {language === 'es' ? 'Mapas de asignacion de TempDB' : 'TempDB Allocation Maps'}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {language === 'es'
                  ? 'Las paginas 2:1:1, 2:1:2 y 2:1:3 se convierten en hot pages cuando demasiadas sesiones crean y destruyen objetos temporales'
                  : 'Pages 2:1:1, 2:1:2 and 2:1:3 become hot pages when too many sessions create and drop temporary objects'}
              </h3>
            </div>
            <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
              {TEMPDB_LAYOUT_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setActiveLayoutId(scenario.id)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                    activeLayoutId === scenario.id
                      ? 'bg-red-500/20 text-red-300'
                      : 'text-white/55 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {pick(language, scenario.title)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-3">
              {TEMPDB_ALLOCATION_PAGES.map((page) => {
                const isActive = page.id === activePageId;
                return (
                  <motion.button
                    key={page.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setActivePageId(page.id as 'pfs' | 'gam' | 'sgam')}
                    className={cn(
                      'w-full rounded-3xl border p-4 text-left transition-all',
                      isActive
                        ? 'border-red-500/25 bg-red-500/10 shadow-[0_0_22px_rgba(248,113,113,0.12)]'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{page.name}</div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">
                          {page.pageId}
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-bold text-white/70">
                        {page.badge}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">{pick(language, page.summary)}</p>
                  </motion.button>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                    <Layers className="h-4 w-4" />
                    {language === 'es' ? 'Pagina activa' : 'Active page'}
                  </div>
                  <h4 className="mt-4 text-xl font-bold text-white">
                    {activePage.name} - {activePage.pageId}
                  </h4>
                  <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activePage.role)}</p>
                  <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
                      <AlertTriangle className="h-4 w-4" />
                      {language === 'es' ? 'Sintoma clasico' : 'Classic symptom'}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activePage.symptom)}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                    <ShieldAlert className="h-4 w-4" />
                    {language === 'es' ? 'Mitigacion principal' : 'Primary mitigation'}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activePage.fix)}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {activeLayout.badges.map((badge) => (
                      <span
                        key={`${activeLayout.id}-${badge}`}
                        className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/70"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                      {language === 'es' ? 'Distribucion de archivos' : 'File distribution'}
                    </div>
                    <h4 className="mt-2 text-lg font-bold text-white">{pick(language, activeLayout.title)}</h4>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
                      {pick(language, activeLayout.summary)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      {language === 'es' ? 'Archivos' : 'Files'}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-white">{activeLayout.files}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {fileCards.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-3xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-blue-300" />
                          <span className="text-sm font-bold text-white">{file.id}</span>
                        </div>
                        <span className="text-xs font-bold text-white/45">{file.pressure}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${file.pressure}%` }}
                          transition={{ duration: 0.55, delay: 0.08 + index * 0.05 }}
                          className={cn(
                            'h-full rounded-full',
                            activeLayout.id === 'single' ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-emerald-400 to-cyan-300'
                          )}
                        />
                      </div>
                      <p className="mt-3 text-xs leading-6 text-white/60">
                        {activeLayout.id === 'single'
                          ? language === 'es'
                            ? 'Un solo archivo concentra todas las rondas de asignacion.'
                            : 'A single file absorbs every allocation round.'
                          : language === 'es'
                            ? 'La actividad se reparte y baja el latch pressure por archivo.'
                            : 'Activity spreads out, reducing latch pressure per file.'}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/75">
                  {pick(language, activeLayout.note)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-red-300">
            {language === 'es' ? 'T-SQL listo para TempDB' : 'Ready-to-paste TempDB T-SQL'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {language === 'es'
              ? 'Localiza PAGELATCH sobre TempDB y revisa si el numero de archivos y el patron de espera explican el cuello de botella.'
              : 'Find TempDB PAGELATCH waits and verify whether file count plus wait pattern explain the bottleneck.'}
          </p>
          <div className="mt-5 space-y-4">
            <CopyCodeBlock code={TEMPDB_IO_TSQL.tempdbContention} accent="rose" />
            <CopyCodeBlock code={TEMPDB_IO_TSQL.ioWriters} accent="blue" />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              {language === 'es' ? 'Escritores de I/O asincrono' : 'Async I/O Writers'}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {language === 'es'
                ? 'Checkpoint escribe para acortar recovery; Lazy Writer escribe para devolver memoria al buffer pool'
                : 'Checkpoint writes to shorten recovery; Lazy Writer writes to give memory back to the buffer pool'}
            </h3>
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            {IO_WRITER_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setActiveWriterId(profile.id)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  activeWriterId === profile.id
                    ? profile.id === 'checkpoint'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-amber-500/20 text-amber-300'
                    : 'text-white/55 hover:bg-white/5 hover:text-white'
                )}
              >
                {pick(language, profile.title)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px]">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <motion.div
                key={`${activeWriter.id}-trigger`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  <Zap className="h-4 w-4" />
                  {language === 'es' ? 'Disparador' : 'Trigger'}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeWriter.trigger)}</p>
              </motion.div>

              <motion.div
                key={`${activeWriter.id}-goal`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="rounded-3xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  <ArrowRight className="h-4 w-4" />
                  {language === 'es' ? 'Objetivo' : 'Goal'}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeWriter.goal)}</p>
              </motion.div>

              <motion.div
                key={`${activeWriter.id}-pattern`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-3xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  <HardDrive className="h-4 w-4" />
                  {language === 'es' ? 'Patron de escritura' : 'Write pattern'}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeWriter.writePattern)}</p>
              </motion.div>
            </div>

            <div
              className={cn(
                'rounded-3xl border p-5',
                activeWriter.id === 'checkpoint'
                  ? 'border-blue-500/20 bg-blue-500/10'
                  : 'border-amber-500/20 bg-amber-500/10'
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                {activeWriter.badges.map((badge) => (
                  <span
                    key={`${activeWriter.id}-${badge}`}
                    className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/75"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-white/85">{pick(language, activeWriter.summary)}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {activeWriter.metrics.map((metric, index) => (
                <motion.div
                  key={`${activeWriter.id}-${metric.value}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-3xl border border-white/10 bg-black/25 p-5"
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                    {pick(language, metric.label)}
                  </div>
                  <div className="mt-3 text-lg font-bold text-white">{metric.value}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <h4 className="text-lg font-bold text-white">
              {language === 'es' ? 'Script del escritor activo' : 'Active writer script'}
            </h4>
            <p className="mt-2 text-sm text-white/60">
              {language === 'es'
                ? 'Cada bloque esta preparado para copiar y correlacionar con contadores y presion de memoria.'
                : 'Each block is ready to copy and correlate with counters and memory pressure.'}
            </p>
            <div className="mt-5">
              <CopyCodeBlock
                code={activeWriter.script}
                accent={activeWriter.id === 'checkpoint' ? 'blue' : 'amber'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
