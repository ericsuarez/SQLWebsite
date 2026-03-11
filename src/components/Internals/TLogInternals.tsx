import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, Database, FileWarning, HardDrive, Layers } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  TLOG_TSQL_SCRIPTS,
  TLOG_VLF_PROFILES,
  TLOG_WAL_STAGES,
  type LocalizedText,
} from '../../data/advancedSQLData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const DOT_POSITIONS = ['12%', '50%', '88%'];

const STAGE_STYLES = [
  {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
  },
  {
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    text: 'text-orange-300',
  },
  {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
  },
] as const;

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

export function TLogInternals() {
  const { language, t } = useLanguage();
  const [activeStage, setActiveStage] = useState(0);
  const [activeProfileId, setActiveProfileId] = useState<'healthy' | 'fragmented'>('healthy');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % TLOG_WAL_STAGES.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  const activeStageData = TLOG_WAL_STAGES[activeStage];
  const activeProfile = TLOG_VLF_PROFILES.find((profile) => profile.id === activeProfileId) ?? TLOG_VLF_PROFILES[0];

  return (
    <div className="flex h-full flex-col gap-6 text-slate-200">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/10" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-5xl">
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-3xl font-bold text-transparent">
              <FileWarning className="h-8 w-8 text-orange-400" />
              {t('tabTlogInternals')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {language === 'es'
                ? 'Desde la regla Write-Ahead Logging hasta el tamano de los VLFs: aqui se ve por que WRITELOG, crash recovery y autogrowth pequeno pueden cambiar por completo el comportamiento de una base.'
                : 'From the Write-Ahead Logging rule to VLF sizing: this module shows why WRITELOG, crash recovery and tiny autogrowth increments can completely change database behavior.'}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
              WRITELOG
            </div>
            <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
              sys.dm_db_log_info
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_380px]">
        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                {language === 'es' ? 'Write-Ahead Logging (WAL)' : 'Write-Ahead Logging'}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {language === 'es'
                  ? 'El commit no ocurre hasta que el log esta endurecido'
                  : 'Commit does not complete until the log is hardened'}
              </h3>
            </div>
            <button
              onClick={() => setActiveStage((current) => (current + 1) % TLOG_WAL_STAGES.length)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {language === 'es' ? 'Siguiente paso WAL' : 'Next WAL step'}
            </button>
          </div>

          <div className="relative mt-8">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-8 h-px bg-gradient-to-r from-cyan-500/30 via-orange-500/30 to-emerald-500/30" />
            <motion.div
              className="pointer-events-none absolute top-[1.15rem] z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(253,186,116,0.75)]"
              animate={{ left: DOT_POSITIONS[activeStage] }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />

            <div className="grid gap-4 lg:grid-cols-3">
              {TLOG_WAL_STAGES.map((stage, index) => {
                const style = STAGE_STYLES[index];
                const isActive = index === activeStage;
                const Icon = index === 0 ? Database : index === 1 ? Activity : HardDrive;

                return (
                  <motion.button
                    key={stage.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setActiveStage(index)}
                    className={cn(
                      'rounded-3xl border p-5 text-left transition-all',
                      isActive
                        ? `${style.border} ${style.bg} shadow-[0_0_24px_rgba(255,255,255,0.05)]`
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border', style.border, style.bg)}>
                        <Icon className={cn('h-5 w-5', style.text)} />
                      </div>
                      <span className={cn('rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', style.bg, style.text)}>
                        {stage.badge}
                      </span>
                    </div>
                    <h4 className={cn('mt-4 text-lg font-bold', isActive ? style.text : 'text-white')}>
                      {pick(language, stage.title)}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      {pick(language, stage.summary)}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/45">
                      <span>{stage.metric}</span>
                      {index < 2 && <ArrowRight className="h-3.5 w-3.5" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStageData.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"
            >
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  <Layers className="h-4 w-4" />
                  {language === 'es' ? 'Detalle del paso activo' : 'Active step detail'}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeStageData.detail)}</p>
              </div>
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">
                  <AlertTriangle className="h-4 w-4" />
                  {language === 'es' ? 'Consecuencia inmediata' : 'Immediate consequence'}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">
                  {activeStageData.id === 'log-buffer'
                    ? language === 'es'
                      ? 'Si el worker todavia no ha endurecido el bloque, el commit no es durable y el cliente aun no debe recibir OK.'
                      : 'If the worker has not hardened the block yet, the commit is not durable and the client must not receive success.'
                    : activeStageData.id === 'log-flush'
                      ? language === 'es'
                        ? 'Aqui aparece WRITELOG: la latencia del dispositivo del log determina cuanto tarda el commit en salir.'
                        : 'This is where WRITELOG shows up: the log device latency decides how long the commit takes.'
                      : language === 'es'
                        ? 'Despues de un crash, el motor escanea VLF por VLF para rehacer o deshacer lo necesario.'
                        : 'After a crash, the engine scans VLF by VLF to redo or undo what is required.'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-orange-300">
            {language === 'es' ? 'T-SQL de log listo para copiar' : 'Ready-to-paste log T-SQL'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {language === 'es'
              ? 'Consulta tamano activo del log, razon de truncado y recuento de VLFs sin salir de DMVs modernas.'
              : 'Inspect active log size, truncation blockers and VLF count from modern DMVs.'}
          </p>
          <div className="mt-5 space-y-4">
            <CopyCodeBlock code={TLOG_TSQL_SCRIPTS.inspectWal} accent="amber" />
            <CopyCodeBlock code={TLOG_TSQL_SCRIPTS.inspectVlfs} accent="cyan" />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              {language === 'es' ? 'Archivos virtuales de log (VLFs)' : 'Virtual Log Files'}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {language === 'es'
                ? 'Un log sano recupera rapido; un log fragmentado obliga a escanear cientos de VLFs'
                : 'A healthy log recovers fast; a fragmented log forces recovery to scan hundreds of VLFs'}
            </h3>
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            {TLOG_VLF_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setActiveProfileId(profile.id)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  activeProfileId === profile.id
                    ? 'bg-orange-500/20 text-orange-300'
                    : 'text-white/55 hover:bg-white/5 hover:text-white'
                )}
              >
                {pick(language, profile.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {TLOG_VLF_PROFILES.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const tone =
              profile.id === 'healthy'
                ? 'border-emerald-500/25 bg-emerald-500/8'
                : 'border-rose-500/25 bg-rose-500/8';

            return (
              <motion.button
                key={profile.id}
                whileHover={{ y: -2 }}
                onClick={() => setActiveProfileId(profile.id)}
                className={cn(
                  'rounded-3xl border p-5 text-left transition-all',
                  tone,
                  isActive ? 'shadow-[0_0_24px_rgba(255,255,255,0.05)]' : 'opacity-85'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">{pick(language, profile.label)}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{pick(language, profile.summary)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">VLFs</div>
                    <div className="mt-1 text-2xl font-black text-white">{profile.vlfCount}</div>
                  </div>
                </div>

                <div
                  className={cn(
                    'mt-5 grid gap-1 rounded-2xl border border-white/10 bg-black/30 p-3',
                    profile.id === 'healthy' ? 'grid-cols-4' : 'grid-cols-12'
                  )}
                >
                  {Array.from({ length: profile.bars }, (_, index) => (
                    <motion.div
                      key={`${profile.id}-${index}`}
                      initial={{ opacity: 0.35 }}
                      animate={{ opacity: isActive ? 1 : 0.55, scaleY: isActive ? 1.04 : 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={cn(
                        'rounded-md',
                        profile.id === 'healthy'
                          ? 'h-7 bg-emerald-400/70'
                          : 'h-4 bg-rose-400/70'
                      )}
                    />
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.badges.map((badge) => (
                    <span
                      key={badge}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                        profile.id === 'healthy'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                          : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                      )}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Impacto en crash recovery' : 'Crash recovery impact'}
            </div>
            <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeProfile.recovery)}</p>
            <p className="mt-4 text-sm leading-7 text-white/60">{pick(language, activeProfile.impact)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {language === 'es' ? 'Carga de escaneo' : 'Scan burden'}
            </div>
            <div className="mt-4 h-3 rounded-full bg-white/10">
              <div
                className={cn(
                  'h-3 rounded-full',
                  activeProfile.id === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'
                )}
                style={{
                  width: `${activeProfile.id === 'healthy' ? 18 : 92}%`,
                }}
              />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              {activeProfile.id === 'healthy'
                ? language === 'es'
                  ? 'Pocos VLFs que revisar'
                  : 'Few VLFs to inspect'
                : language === 'es'
                  ? 'Cadena larga de VLFs pequenos'
                  : 'Long chain of tiny VLFs'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
