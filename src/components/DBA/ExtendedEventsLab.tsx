import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, Pause, Play, Radar, RotateCcw, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { XEVENT_LABS, type LocalizedCaseText } from './realCasesData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

type ViewMode = 'intro' | 'play';

const STAGES = [
  {
    id: 'configure',
    badge: 'STEP 1',
    title: { en: 'Configure Session', es: 'Configurar sesion' },
    detail: {
      en: 'Define events and actions so SQL captures context before the issue disappears.',
      es: 'Define eventos y acciones para capturar contexto antes de que el incidente desaparezca.',
    },
    tone: 'text-orange-300 border-orange-500/30 bg-orange-500/10',
  },
  {
    id: 'capture',
    badge: 'STEP 2',
    title: { en: 'Capture in Real Time', es: 'Capturar en tiempo real' },
    detail: {
      en: 'Start the session and keep writing to event_file while workload is live.',
      es: 'Inicia la sesion y mantiene escritura en event_file mientras la carga esta activa.',
    },
    tone: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  },
  {
    id: 'incident',
    badge: 'STEP 3',
    title: { en: 'Intermittent Incident', es: 'Incidente intermitente' },
    detail: {
      en: 'The problem occurs and vanishes fast. DMVs may already be empty.',
      es: 'El problema ocurre y desaparece rapido. Las DMVs pueden llegar tarde.',
    },
    tone: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  },
  {
    id: 'analyze',
    badge: 'STEP 4',
    title: { en: 'Read Evidence', es: 'Leer evidencia' },
    detail: {
      en: 'Parse the XE file and correlate app, wait pattern and SQL text.',
      es: 'Lee el XE file y correlaciona aplicacion, patron de espera y SQL text.',
    },
    tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  },
] as const;

const LAB_STREAM: Record<string, LocalizedCaseText[]> = {
  'attention-timeouts': [
    { en: 'Session created with sqlserver.attention + rpc_completed actions.', es: 'Sesion creada con sqlserver.attention + acciones de rpc_completed.' },
    { en: 'Client app sends request and duration starts to climb.', es: 'La app cliente envia la consulta y la duracion empieza a subir.' },
    { en: 'Timeout triggers ATTENTION. Request is cancelled from app side.', es: 'Salta el timeout y llega ATTENTION. La peticion se cancela desde la app.' },
    { en: 'XE file confirms caller, timestamp and cancelled SQL text.', es: 'El XE file confirma llamador, timestamp y SQL cancelado.' },
  ],
  'blocked-process': [
    { en: 'blocked process threshold configured at 5 seconds.', es: 'blocked process threshold configurado a 5 segundos.' },
    { en: 'A blocker keeps transaction open and waiter chain starts.', es: 'Un bloqueador mantiene transaccion abierta y empieza la cadena de espera.' },
    { en: 'The chain ends before DBA opens dm_exec_requests.', es: 'La cadena termina antes de abrir dm_exec_requests.' },
    { en: 'blocked_process_report XML preserves the full graph.', es: 'El XML de blocked_process_report conserva el grafo completo.' },
  ],
  'deadlock-graph': [
    { en: 'XE session armed for xml_deadlock_report.', es: 'Sesion XE armada para xml_deadlock_report.' },
    { en: 'Two sessions invert lock order on shared resources.', es: 'Dos sesiones invierten orden de lock sobre recursos compartidos.' },
    { en: 'SQL resolves deadlock and victim session is killed.', es: 'SQL resuelve el deadlock y mata la sesion victima.' },
    { en: 'Deadlock XML reveals victim, owners and lock sequence.', es: 'El XML de deadlock revela victima, owners y secuencia de locks.' },
  ],
};

function pick(language: 'en' | 'es', value: LocalizedCaseText) {
  return language === 'es' ? value.es : value.en;
}

export function ExtendedEventsLab() {
  const { language, t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [activeLabId, setActiveLabId] = useState(XEVENT_LABS[0]?.id ?? '');
  const [activeStage, setActiveStage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const activeLab = useMemo(
    () => XEVENT_LABS.find((lab) => lab.id === activeLabId) ?? XEVENT_LABS[0],
    [activeLabId]
  );
  const feed = LAB_STREAM[activeLab?.id ?? ''] ?? [];

  useEffect(() => {
    if (viewMode !== 'play' || !autoPlay) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStage((current) => {
        if (current >= STAGES.length - 1) {
          setAutoPlay(false);
          return current;
        }
        return current + 1;
      });
    }, 2200);

    return () => window.clearInterval(timer);
  }, [autoPlay, viewMode]);

  useEffect(() => {
    setActiveStage(0);
    setAutoPlay(false);
  }, [activeLabId]);

  if (!activeLab) {
    return null;
  }

  const visibleFeed = feed.slice(0, Math.min(feed.length, activeStage + 1));
  const incidentScore = Math.round(((activeStage + 1) / STAGES.length) * 100);

  if (viewMode === 'intro') {
    return (
      <div className="flex min-h-full flex-col gap-5">
        <div className="glass-panel relative overflow-hidden border border-white/10 p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_34%)]" />
          <div className="relative z-10">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-white">
              <Radar className="h-6 w-6 text-orange-300" />
              {t('tabXEvents')}
            </h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/80">
              {language === 'es'
                ? 'Ruta dedicada a incidentes que desaparecen antes de abrir una DMV. Primero defines la sesion XE y luego entras en play para ver como aparece la evidencia paso a paso.'
                : 'Dedicated path for incidents that disappear before you can inspect a DMV. First define the XE session, then enter play to follow the evidence step by step.'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {XEVENT_LABS.map((lab) => (
            <button
              key={lab.id}
              onClick={() => {
                setActiveLabId(lab.id);
                setViewMode('play');
              }}
              className="glass-panel rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-white">{pick(language, lab.title)}</div>
                <ArrowRight className="h-4 w-4 text-white/50" />
              </div>
              <p className="mt-3 text-sm leading-7 text-white/70">{pick(language, lab.summary)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lab.badges.map((badge) => (
                  <span
                    key={`${lab.id}-${badge}`}
                    className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          {XEVENT_LABS.map((lab) => {
            const isActive = lab.id === activeLab.id;
            return (
              <button
                key={lab.id}
                onClick={() => setActiveLabId(lab.id)}
                className={cn(
                  'flex w-full items-center justify-start gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all sm:w-auto',
                  isActive ? 'border border-white/20 bg-white/10 text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                )}
              >
                <Radar className={cn('h-4 w-4', isActive ? 'text-orange-300' : 'text-muted-foreground')} />
                {pick(language, lab.title)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveStage(0)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
            {language === 'es' ? 'Reset' : 'Reset'}
          </button>
          <button
            onClick={() => setAutoPlay((current) => !current)}
            className={cn(
              'rounded-xl border px-3 py-2 text-xs font-bold transition-all',
              autoPlay
                ? 'border-orange-500/30 bg-orange-500/15 text-orange-300'
                : 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300'
            )}
          >
            {autoPlay ? <Pause className="mr-1 inline h-3.5 w-3.5" /> : <Play className="mr-1 inline h-3.5 w-3.5" />}
            {autoPlay ? (language === 'es' ? 'Pausar' : 'Pause') : (language === 'es' ? 'Auto Play' : 'Auto Play')}
          </button>
          <button
            onClick={() => setViewMode('intro')}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
          >
            {language === 'es' ? 'Descripcion' : 'Description'}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_390px]">
        <div className="glass-panel rounded-3xl border border-white/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-white">{pick(language, activeLab.title)}</h3>
              <p className="mt-2 text-sm leading-7 text-white/80">{pick(language, activeLab.summary)}</p>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
                {language === 'es' ? 'Progreso de evidencia' : 'Evidence progress'}
              </div>
              <div className="mt-1 text-2xl font-black text-white">{incidentScore}%</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {STAGES.map((stage, index) => {
              const isActive = index === activeStage;
              const isPast = index < activeStage;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(index)}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all',
                    isActive ? stage.tone : isPast ? 'border-white/20 bg-white/[0.06] text-white/80' : 'border-white/10 bg-black/20 text-white/55'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{stage.badge}</span>
                    <span className={cn('h-2.5 w-2.5 rounded-full', isActive ? 'bg-current' : isPast ? 'bg-white/50' : 'bg-white/20')} />
                  </div>
                  <div className="mt-2 text-sm font-black">{pick(language, stage.title)}</div>
                  <p className="mt-2 text-xs leading-6">{pick(language, stage.detail)}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
              <Activity className="h-4 w-4" />
              {language === 'es' ? 'Event stream (play)' : 'Event stream (play)'}
            </div>
            <div className="mt-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {visibleFeed.map((line, index) => (
                  <motion.div
                    key={`${activeLab.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80"
                  >
                    {pick(language, line)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-5">
          <h4 className="text-lg font-bold text-white">
            {activeStage < 2
              ? language === 'es'
                ? 'Script de captura'
                : 'Capture script'
              : language === 'es'
                ? 'Script de lectura'
                : 'Readback script'}
          </h4>
          <p className="mt-2 text-sm leading-7 text-white/75">{pick(language, activeLab.why)}</p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">
              {activeStage < 2 ? <AlertTriangle className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {activeStage < 2
                ? language === 'es'
                  ? 'Config y start'
                  : 'Config and start'
                : language === 'es'
                  ? 'Analisis post-mortem'
                  : 'Post-mortem analysis'}
            </div>
            <CopyCodeBlock
              code={pick(language, activeStage < 2 ? activeLab.sessionScript : activeLab.readbackScript)}
              accent={activeStage < 2 ? 'amber' : 'blue'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
