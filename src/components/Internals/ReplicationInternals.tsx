import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowRight, Database, GitBranch, Layers, Server } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  REPLICATION_MODES,
  REPLICATION_ROLES,
  REPLICATION_STAGES,
  REPLICATION_TSQL,
  type LocalizedText,
} from '../../data/advancedSQLData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const STAGE_DOT_POSITIONS = ['8%', '35%', '64%', '92%'];

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

export function ReplicationInternals() {
  const { language, t } = useLanguage();
  const [activeStage, setActiveStage] = useState(0);
  const [activeModeId, setActiveModeId] = useState<(typeof REPLICATION_MODES)[number]['id']>('transactional');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % REPLICATION_STAGES.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  const activeStageData = REPLICATION_STAGES[activeStage];
  const activeMode = REPLICATION_MODES.find((mode) => mode.id === activeModeId) ?? REPLICATION_MODES[1];

  return (
    <div className="flex min-h-full flex-col gap-4 text-slate-200 sm:gap-6">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_34%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-5xl">
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 bg-clip-text text-3xl font-bold text-transparent">
              <GitBranch className="h-8 w-8 text-sky-400" />
              {t('tabReplication')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {language === 'es'
                ? 'Esta capa muestra la replicacion clasica de SQL Server: Publisher, Distributor, Subscriber, agentes, latencia y el motivo por el que snapshot, transactional, merge y peer-to-peer no resuelven el mismo problema.'
                : 'This layer shows classic SQL Server replication: Publisher, Distributor, Subscriber, agents, latency and why snapshot, transactional, merge and peer-to-peer do not solve the same problem.'}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <div className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-300">
              Publisher
            </div>
            <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
              Distributor
            </div>
            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              Subscriber
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_380px]">
        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                {language === 'es' ? 'Flujo de replicacion' : 'Replication flow'}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {language === 'es'
                  ? 'Los cambios salen del publisher, atraviesan la distribution database y aterrizan en el subscriber'
                  : 'Changes leave the publisher, traverse the distribution database and land on the subscriber'}
              </h3>
            </div>
            <button
              onClick={() => setActiveStage((current) => (current + 1) % REPLICATION_STAGES.length)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {language === 'es' ? 'Siguiente etapa' : 'Next stage'}
            </button>
          </div>

          <div className="relative mt-8">
            <motion.div
              className="pointer-events-none absolute top-[1.15rem] z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.75)]"
              animate={{ left: STAGE_DOT_POSITIONS[activeStage] }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />

            <div className="grid gap-4 lg:grid-cols-4">
              {REPLICATION_STAGES.map((stage, index) => {
                const isActive = index === activeStage;
                const Icon = index === 0 ? Database : index === 1 ? Activity : index === 2 ? Layers : Server;

                return (
                  <motion.button
                    key={stage.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setActiveStage(index)}
                    className={cn(
                      'rounded-3xl border p-5 text-left transition-all',
                      isActive
                        ? 'border-sky-500/25 bg-sky-500/10 shadow-[0_0_24px_rgba(255,255,255,0.05)]'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-500/10">
                        <Icon className="h-5 w-5 text-sky-300" />
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                        {stage.badge}
                      </span>
                    </div>
                    <h4 className="mt-4 text-lg font-bold text-white">{pick(language, stage.title)}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{pick(language, stage.summary)}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/45">
                      <span>{stage.actor}</span>
                      {index < REPLICATION_STAGES.length - 1 && <ArrowRight className="h-3.5 w-3.5" />}
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
                  {language === 'es' ? 'Etapa activa' : 'Active stage'}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeStageData.summary)}</p>
              </div>
              <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">
                  {language === 'es' ? 'Actor principal' : 'Primary actor'}
                </div>
                <div className="mt-4 text-lg font-bold text-white">{activeStageData.actor}</div>
                <p className="mt-3 text-sm leading-7 text-white/80">
                  {language === 'es'
                    ? 'Cuando esta etapa se retrasa, la latencia sube y el subscriber deja de parecer una copia cercana del origen.'
                    : 'When this stage slows down, latency rises and the subscriber stops looking like a close copy of the source.'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-sky-300">
            {language === 'es' ? 'T-SQL de replicacion listo para copiar' : 'Ready-to-paste replication T-SQL'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {language === 'es'
              ? 'Revisa publicaciones, suscripciones y latencia desde la distribution database y los procedimientos de monitorizacion.'
              : 'Inspect publications, subscriptions and latency from the distribution database and monitoring procedures.'}
          </p>
          <div className="mt-5 space-y-4">
            <CopyCodeBlock code={REPLICATION_TSQL.topology} accent="blue" />
            <CopyCodeBlock code={REPLICATION_TSQL.latency} accent="cyan" />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {REPLICATION_ROLES.map((role) => (
            <motion.div
              key={role.id}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-white">{pick(language, role.title)}</h4>
                <span className="rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300">
                  {role.badge}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/75">{pick(language, role.summary)}</p>
              <p className="mt-4 text-xs leading-6 text-white/55">{pick(language, role.detail)}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              {language === 'es' ? 'Topologias de replicacion' : 'Replication topologies'}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {language === 'es'
                ? 'Snapshot, transactional, merge y peer-to-peer tienen objetivos y riesgos distintos'
                : 'Snapshot, transactional, merge and peer-to-peer have different goals and risks'}
            </h3>
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            {REPLICATION_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveModeId(mode.id)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  activeModeId === mode.id
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-white/55 hover:bg-white/5 hover:text-white'
                )}
              >
                {pick(language, mode.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <h4 className="text-lg font-bold text-white">{pick(language, activeMode.label)}</h4>
            <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activeMode.summary)}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  {language === 'es' ? 'Donde encaja' : 'Where it fits'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activeMode.strengths)}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                  {language === 'es' ? 'Riesgo principal' : 'Primary risk'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activeMode.tradeoff)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
              {language === 'es' ? 'Perfil operativo' : 'Operational profile'}
            </div>
            <div className="mt-4 text-2xl font-bold text-sky-300">{activeMode.latency}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              {activeMode.badges.map((badge) => (
                <span
                  key={`${activeMode.id}-${badge}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-white/75"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
