import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Cpu,
  Layers,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { MODERN_FEATURES } from '../../data/advancedSQLData';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const ICONS: Record<string, any> = {
  RotateCcw,
  Brain,
  Cpu,
  Zap,
  Layers,
};

const FEATURE_STYLES = {
  emerald: {
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    chip: 'bg-emerald-500/15 text-emerald-300',
    line: 'from-emerald-500/60',
    accent: 'emerald' as const,
  },
  blue: {
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    chip: 'bg-blue-500/15 text-blue-300',
    line: 'from-blue-500/60',
    accent: 'blue' as const,
  },
  violet: {
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    chip: 'bg-violet-500/15 text-violet-300',
    line: 'from-violet-500/60',
    accent: 'violet' as const,
  },
  amber: {
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    chip: 'bg-amber-500/15 text-amber-300',
    line: 'from-amber-500/60',
    accent: 'amber' as const,
  },
  cyan: {
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    chip: 'bg-cyan-500/15 text-cyan-300',
    line: 'from-cyan-500/60',
    accent: 'cyan' as const,
  },
} as const;

const FEATURE_VISUALS = {
  adr: {
    signal: {
      es: 'Rollback y recovery dejan de depender de deshacer horas de log.',
      en: 'Rollback and recovery stop depending on replaying hours of log.',
    },
    before: [
      { es: 'Rollback fisico recorriendo el log hacia atras', en: 'Physical rollback walking the log backwards' },
      { es: 'Recovery bloqueando la base demasiado tiempo', en: 'Recovery keeps the database busy for too long' },
      { es: 'Una transaccion enorme castiga a todo el motor', en: 'A single huge transaction punishes the whole engine' },
    ],
    after: [
      { es: 'PVS persistente para versiones abortadas', en: 'Persistent version store tracks aborted row versions' },
      { es: 'Logical revert casi inmediato', en: 'Logical revert completes almost immediately' },
      { es: 'Crash recovery mucho mas predecible', en: 'Crash recovery becomes much more predictable' },
    ],
    script: `ALTER DATABASE SalesDB
SET ACCELERATED_DATABASE_RECOVERY = ON;`,
  },
  iqp: {
    signal: {
      es: 'El optimizador aprende de ejecuciones anteriores y corrige memoria y joins.',
      en: 'The optimizer learns from previous executions and corrects memory grants and joins.',
    },
    before: [
      { es: 'Memory grants desajustados', en: 'Oversized or undersized memory grants' },
      { es: 'Bad cardinality en TVFs y tablas variables', en: 'Poor cardinality in TVFs and table variables' },
      { es: 'Planes rigidos aunque cambien las filas reales', en: 'Rigid plans even when real row counts change' },
    ],
    after: [
      { es: 'Memory Grant Feedback corrige spills', en: 'Memory Grant Feedback corrects spills' },
      { es: 'Adaptive Join cambia sobre la marcha', en: 'Adaptive Join switches mid execution' },
      { es: 'Interleaved execution reduce errores de estimacion', en: 'Interleaved execution reduces estimation errors' },
    ],
    script: `SELECT qs.last_grant_kb,
       qs.last_used_grant_kb,
       qs.last_ideal_grant_kb,
       st.text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
WHERE qs.last_grant_kb > 0
ORDER BY qs.last_grant_kb DESC;`,
  },
  hybridBp: {
    signal: {
      es: 'PMEM permite saltarse parte del camino disco -> RAM -> CPU.',
      en: 'PMEM lets SQL Server bypass part of the disk -> RAM -> CPU path.',
    },
    before: [
      { es: 'Lectura desde almacenamiento tradicional', en: 'Read path starts on traditional storage' },
      { es: 'Copia obligatoria al Buffer Pool', en: 'Mandatory copy into the Buffer Pool' },
      { es: 'Mas latencia en warmup y page faults', en: 'More latency during warmup and page faults' },
    ],
    after: [
      { es: 'Archivo mapeado en memoria persistente', en: 'File mapped on persistent memory' },
      { es: 'Acceso casi directo a la pagina', en: 'Near direct access to the page' },
      { es: 'Menos copias en la ruta de lectura', en: 'Fewer copies in the read path' },
    ],
    script: `SELECT DB_NAME(database_id) AS db_name,
       file_id,
       io_stall_read_ms,
       num_of_reads
FROM sys.dm_io_virtual_file_stats(NULL, NULL)
ORDER BY io_stall_read_ms DESC;`,
  },
  hekaton: {
    signal: {
      es: 'Tablas criticas viven en memoria con MVCC y sin latch/lock tradicional.',
      en: 'Critical tables live in memory with MVCC and without traditional latch/lock paths.',
    },
    before: [
      { es: 'Bloqueos y latches en tablas muy calientes', en: 'Locks and latches on hot tables' },
      { es: 'Procedimientos interpretados', en: 'Interpreted stored procedures' },
      { es: 'Mas overhead por acceso concurrente', en: 'More overhead under heavy concurrency' },
    ],
    after: [
      { es: 'Bw-Tree lock-free', en: 'Lock-free Bw-Tree structures' },
      { es: 'Versionado MVCC', en: 'MVCC based row versioning' },
      { es: 'Native compilation opcional', en: 'Optional native compilation' },
    ],
    script: `SELECT name,
       durability_desc,
       memory_optimized
FROM sys.tables
WHERE memory_optimized = 1;`,
  },
  sqlpal: {
    signal: {
      es: 'SQLPAL desacopla el motor de la API de Windows para correr igual en Linux.',
      en: 'SQLPAL decouples the engine from Windows APIs so it can run the same way on Linux.',
    },
    before: [
      { es: 'Dependencia fuerte de llamadas Win32', en: 'Heavy dependency on Win32 APIs' },
      { es: 'Portar el motor completo seria inviable', en: 'Porting the whole engine would be unmanageable' },
      { es: 'Mantener la misma base de codigo era dificil', en: 'Keeping the same codebase was difficult' },
    ],
    after: [
      { es: 'Capa de abstraccion para syscalls', en: 'Abstraction layer for syscalls' },
      { es: 'Mismo motor, distinto host', en: 'Same engine, different host' },
      { es: 'Menor friccion entre Windows y Linux', en: 'Lower friction between Windows and Linux' },
    ],
    script: `SELECT host_platform,
       host_distribution,
       host_release,
       sqlserver_start_time
FROM sys.dm_os_host_info;`,
  },
} as const;

export function ModernFeatures() {
  const { t, language } = useLanguage();
  const [selectedFeatureId, setSelectedFeatureId] = useState(MODERN_FEATURES[0]?.id ?? 'adr');

  const selectedFeature =
    MODERN_FEATURES.find((feature) => feature.id === selectedFeatureId) ?? MODERN_FEATURES[0];
  const selectedStyle = FEATURE_STYLES[selectedFeature.color as keyof typeof FEATURE_STYLES];
  const selectedVisual = FEATURE_VISUALS[selectedFeature.id as keyof typeof FEATURE_VISUALS];
  const SelectedIcon = ICONS[selectedFeature.icon] || Sparkles;
  const langText = (value: { es: string; en: string }) => (language === 'es' ? value.es : value.en);

  return (
    <div className="flex h-full flex-col gap-6 text-slate-200">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-3xl font-bold text-transparent">
              <Sparkles className="h-8 w-8 text-yellow-400" />
              {t('tabModern')}
            </h2>
            <p className="max-w-4xl text-sm text-muted-foreground">{t('modMainDesc')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="glass-panel h-fit rounded-3xl border border-white/10 p-4">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                {language === 'es' ? 'Selecciona una capacidad' : 'Select a capability'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {language === 'es'
                  ? 'Cada bloque abre una explicacion visual y un ejemplo operativo.'
                  : 'Each block opens a visual explanation and an operational example.'}
              </p>
            </div>

            <div className="grid gap-3">
              {MODERN_FEATURES.map((feature, index) => {
                const Icon = ICONS[feature.icon] || Sparkles;
                const style = FEATURE_STYLES[feature.color as keyof typeof FEATURE_STYLES];
                const isActive = feature.id === selectedFeatureId;

                return (
                  <motion.button
                    key={feature.id}
                    onClick={() => setSelectedFeatureId(feature.id)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'group rounded-2xl border p-4 text-left transition-all duration-300',
                      isActive
                        ? `${style.border} ${style.bg} shadow-[0_0_24px_rgba(255,255,255,0.06)]`
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
                          style.bg,
                          style.border,
                          style.text
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={cn('text-base font-bold', isActive ? style.text : 'text-white')}>
                            {t(feature.titleKey)}
                          </h3>
                          <span
                            className={cn(
                              'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
                              style.chip
                            )}
                          >
                            {feature.version}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-white/65">{t(feature.descKey)}</p>
                        <div
                          className={cn(
                            'mt-3 inline-flex items-center gap-1 text-xs font-bold',
                            isActive ? style.text : 'text-white/40'
                          )}
                        >
                          {language === 'es' ? 'Ver arquitectura' : 'View architecture'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFeature.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-6"
            >
              <div className={cn('glass-panel rounded-3xl border p-6 sm:p-8', selectedStyle.border)}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-14 w-14 items-center justify-center rounded-2xl border',
                              selectedStyle.bg,
                              selectedStyle.border,
                              selectedStyle.text
                            )}
                          >
                            <SelectedIcon className="h-7 w-7" />
                          </div>
                          <div>
                            <h3 className={cn('text-2xl font-bold', selectedStyle.text)}>
                              {t(selectedFeature.titleKey)}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
                                  selectedStyle.chip
                                )}
                              >
                                SQL Server {selectedFeature.version}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                                {language === 'es' ? 'Visual y operativo' : 'Visual and operational'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-base leading-relaxed text-white/80">
                          {t(selectedFeature.detailKey)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      {selectedVisual.after.map((item, index) => (
                        <div key={item.es} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className={cn('mb-2 text-xs font-bold uppercase tracking-[0.18em]', selectedStyle.text)}>
                            {language === 'es' ? `Mejora ${index + 1}` : `Improvement ${index + 1}`}
                          </div>
                          <p className="text-sm text-white/80">{langText(item)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">
                          {language === 'es' ? 'Ruta visual' : 'Visual path'}
                        </h4>
                        <span className={cn('text-sm font-semibold', selectedStyle.text)}>
                          {langText(selectedVisual.signal)}
                        </span>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                          <div className="mb-4 text-sm font-bold text-rose-300">
                            {language === 'es' ? 'Antes' : 'Before'}
                          </div>
                          <div className="space-y-3">
                            {selectedVisual.before.map((item, index) => (
                              <div key={item.es} className="flex items-start gap-3">
                                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" />
                                <div className="flex-1">
                                  <div className="text-sm text-white/80">{langText(item)}</div>
                                  {index < selectedVisual.before.length - 1 && (
                                    <div className="ml-1 mt-3 h-6 w-px bg-gradient-to-b from-rose-400/60 to-transparent" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={cn('rounded-2xl border bg-black/30 p-5', selectedStyle.border)}>
                          <div className={cn('mb-4 text-sm font-bold', selectedStyle.text)}>
                            {language === 'es' ? 'Despues' : 'After'}
                          </div>
                          <div className="space-y-3">
                            {selectedVisual.after.map((item, index) => (
                              <div key={item.es} className="flex items-start gap-3">
                                <div className={cn('mt-1 h-2.5 w-2.5 rounded-full', selectedStyle.bg, selectedStyle.border)} />
                                <div className="flex-1">
                                  <div className="text-sm text-white/80">{langText(item)}</div>
                                  {index < selectedVisual.after.length - 1 && (
                                    <div
                                      className={cn(
                                        'ml-1 mt-3 h-6 w-px bg-gradient-to-b to-transparent',
                                        selectedStyle.line
                                      )}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className={cn('rounded-3xl border p-5', selectedStyle.border, selectedStyle.bg)}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                        {language === 'es' ? 'Impacto visual' : 'Visual impact'}
                      </p>
                      <div className="mt-4 space-y-4">
                        {[72, 54, 31].map((value, index) => (
                          <div key={`${selectedFeature.id}-${value}`} className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-white/60">
                              <span>
                                {language === 'es'
                                  ? index === 0
                                    ? 'Latencia operativa'
                                    : index === 1
                                      ? 'Trabajo del motor'
                                      : 'Tiempo de recuperacion'
                                  : index === 0
                                    ? 'Operational latency'
                                    : index === 1
                                      ? 'Engine overhead'
                                      : 'Recovery time'}
                              </span>
                              <span className={selectedStyle.text}>
                                {language === 'es'
                                  ? index === 2
                                    ? `${Math.max(2, 100 - value)}% menos`
                                    : `${Math.max(10, 100 - value)}% mejor`
                                  : index === 2
                                    ? `${Math.max(2, 100 - value)}% lower`
                                    : `${Math.max(10, 100 - value)}% better`}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-black/30">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                className={cn('h-2 rounded-full', selectedStyle.bg)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                        {language === 'es' ? 'Consulta rapida' : 'Quick check'}
                      </p>
                      <CopyCodeBlock code={selectedVisual.script} accent={selectedStyle.accent} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
