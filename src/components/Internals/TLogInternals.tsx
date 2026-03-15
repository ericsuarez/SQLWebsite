import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Database,
  FileWarning,
  HardDrive,
  Layers,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TLOG_TSQL_SCRIPTS, TLOG_VLF_PROFILES, TLOG_WAL_STAGES, type LocalizedText } from '../../data/advancedSQLData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const DOT_POSITIONS = ['12%', '50%', '88%'];
const STAGE_STYLES = [
  { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-300' },
  { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-300' },
  { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
] as const;

type VlfActionId = 'write' | 'truncate' | 'recover' | 'growth';
type VlfState = 'reusable' | 'active' | 'current' | 'future' | 'new' | 'scan';

const VLF_ACTIONS: Array<{ id: VlfActionId; label: LocalizedText; summary: LocalizedText }> = [
  {
    id: 'write',
    label: { en: 'Write path', es: 'Ruta de escritura' },
    summary: { en: 'The write head keeps appending into the active chain.', es: 'El cabezal sigue escribiendo dentro de la cadena activa.' },
  },
  {
    id: 'truncate',
    label: { en: 'Log reuse', es: 'Reutilización' },
    summary: { en: 'Old VLFs become reusable after truncation/backups.', es: 'Los VLFs viejos pasan a ser reutilizables tras truncado/backups.' },
  },
  {
    id: 'recover',
    label: { en: 'Crash recovery', es: 'Crash recovery' },
    summary: { en: 'Recovery walks the active chain VLF by VLF.', es: 'Recovery recorre la cadena activa VLF por VLF.' },
  },
  {
    id: 'growth',
    label: { en: 'Autogrowth', es: 'Autogrowth' },
    summary: { en: 'Tiny growth creates many new small VLFs.', es: 'Un growth pequeño crea muchos VLFs pequeños.' },
  },
];

const VLF_STATE_STYLE: Record<VlfState, string> = {
  reusable: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-100',
  active: 'border-amber-500/30 bg-amber-500/15 text-amber-100',
  current: 'border-orange-400/60 bg-orange-500/25 text-orange-50 shadow-[0_0_18px_rgba(249,115,22,0.35)]',
  future: 'border-white/10 bg-white/[0.04] text-white/40',
  new: 'border-rose-500/30 bg-rose-500/15 text-rose-100',
  scan: 'border-cyan-400/60 bg-cyan-500/20 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.3)]',
};

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

function buildVlfVisual(profileId: 'healthy' | 'fragmented', action: VlfActionId, frame: number) {
  const base = profileId === 'healthy' ? 14 : 24;
  const extra = action === 'growth' ? (profileId === 'healthy' ? 2 : 8) : 0;
  const reusableBase = profileId === 'healthy' ? 4 : 5;
  const activeSpan = profileId === 'healthy' ? 5 : 11;
  const head = Math.min(base - 2, reusableBase + activeSpan - 1 + (frame % (profileId === 'healthy' ? 3 : 5)));
  const truncateAt = Math.min(head - 1, reusableBase + (frame % (profileId === 'healthy' ? 3 : 6)));
  const scanAt = Math.min(head, reusableBase + (frame % activeSpan));
  const blocks = Array.from({ length: base + extra }, (_, index) => {
    let state: VlfState = 'future';
    if (action === 'growth' && index >= base) state = 'new';
    else if (action === 'recover') {
      if (index < reusableBase) state = 'reusable';
      else if (index === scanAt) state = 'scan';
      else if (index <= head) state = 'active';
    } else if (action === 'truncate') {
      if (index < truncateAt) state = 'reusable';
      else if (index < head) state = 'active';
      else if (index === head) state = 'current';
    } else {
      if (index < reusableBase) state = 'reusable';
      else if (index < head) state = 'active';
      else if (index === head) state = 'current';
    }
    return { id: index, label: `VLF ${String(index + 1).padStart(2, '0')}`, state };
  });
  return {
    blocks,
    head,
    scanAt,
    reusableCount: blocks.filter((block) => block.state === 'reusable').length,
    activeCount: blocks.filter((block) => ['active', 'current', 'scan'].includes(block.state)).length,
    growthCount: blocks.filter((block) => block.state === 'new').length,
  };
}

function stateLabel(language: 'en' | 'es', state: VlfState) {
  const map: Record<VlfState, LocalizedText> = {
    reusable: { en: 'Reusable', es: 'Reutilizable' },
    active: { en: 'Active chain', es: 'Cadena activa' },
    current: { en: 'Current write head', es: 'Cabezal actual' },
    future: { en: 'Not used yet', es: 'Aún sin usar' },
    new: { en: 'New from growth', es: 'Nuevo por growth' },
    scan: { en: 'Recovery scan', es: 'Lectura de recovery' },
  };
  return pick(language, map[state]);
}

function stateDetail(language: 'en' | 'es', state: VlfState) {
  const map: Record<VlfState, LocalizedText> = {
    reusable: { en: 'Already free to be reused when the log wraps.', es: 'Ya está libre para reutilizarse cuando el log haga wrap.' },
    active: { en: 'Still part of the active chain that recovery must walk.', es: 'Sigue dentro de la cadena activa que recovery debe recorrer.' },
    current: { en: 'This is where the next flushed log block lands.', es: 'Aquí cae el siguiente bloque vaciado del log.' },
    future: { en: 'This slice exists but the active chain has not reached it yet.', es: 'Esta porción existe pero la cadena activa aún no ha llegado.' },
    new: { en: 'Created by autogrowth. Too many of these fragment the log.', es: 'Creado por autogrowth. Tener demasiados fragmenta el log.' },
    scan: { en: 'Recovery is reading this VLF now.', es: 'Recovery está leyendo este VLF ahora.' },
  };
  return pick(language, map[state]);
}

export function TLogInternals() {
  const { language, t } = useLanguage();
  const [activeStage, setActiveStage] = useState(0);
  const [activeProfileId, setActiveProfileId] = useState<'healthy' | 'fragmented'>('healthy');
  const [activeVlfAction, setActiveVlfAction] = useState<VlfActionId>('write');
  const [vlfFrame, setVlfFrame] = useState(0);
  const [isVlfPlaying, setIsVlfPlaying] = useState(true);
  const [selectedVlfIndex, setSelectedVlfIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveStage((current) => (current + 1) % TLOG_WAL_STAGES.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isVlfPlaying) return;
    const timer = window.setInterval(() => setVlfFrame((current) => current + 1), 1800);
    return () => window.clearInterval(timer);
  }, [isVlfPlaying]);

  useEffect(() => {
    const resetVisual = buildVlfVisual(activeProfileId, activeVlfAction, 0);
    setVlfFrame(0);
    setSelectedVlfIndex(activeVlfAction === 'recover' ? resetVisual.scanAt : resetVisual.head);
  }, [activeProfileId, activeVlfAction]);

  const activeStageData = TLOG_WAL_STAGES[activeStage];
  const activeProfile = TLOG_VLF_PROFILES.find((profile) => profile.id === activeProfileId) ?? TLOG_VLF_PROFILES[0];
  const activeActionMeta = VLF_ACTIONS.find((action) => action.id === activeVlfAction) ?? VLF_ACTIONS[0];
  const vlfVisual = useMemo(() => buildVlfVisual(activeProfileId, activeVlfAction, vlfFrame), [activeProfileId, activeVlfAction, vlfFrame]);
  const selectedVlf = vlfVisual.blocks[selectedVlfIndex] ?? vlfVisual.blocks[0];

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
                ? 'Desde la regla Write-Ahead Logging hasta el tamaño de los VLFs: aquí se ve por qué WRITELOG, crash recovery y un autogrowth pequeño pueden cambiar por completo el comportamiento de una base.'
                : 'From the Write-Ahead Logging rule to VLF sizing: this module shows why WRITELOG, crash recovery and tiny autogrowth increments can completely change database behavior.'}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">WRITELOG</div>
            <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">sys.dm_db_log_info</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_380px]">
        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">{language === 'es' ? 'Write-Ahead Logging (WAL)' : 'Write-Ahead Logging'}</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{language === 'es' ? 'El commit no ocurre hasta que el log está endurecido' : 'Commit does not complete until the log is hardened'}</h3>
            </div>
            <button
              onClick={() => setActiveStage((current) => (current + 1) % TLOG_WAL_STAGES.length)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {language === 'es' ? 'Siguiente paso WAL' : 'Next WAL step'}
            </button>
          </div>

          <div className="relative mt-8">
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
                    className={cn('rounded-3xl border p-5 text-left transition-all', isActive ? `${style.border} ${style.bg} shadow-[0_0_24px_rgba(255,255,255,0.05)]` : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border', style.border, style.bg)}>
                        <Icon className={cn('h-5 w-5', style.text)} />
                      </div>
                      <span className={cn('rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', style.bg, style.text)}>{stage.badge}</span>
                    </div>
                    <h4 className={cn('mt-4 text-lg font-bold', isActive ? style.text : 'text-white')}>{pick(language, stage.title)}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{pick(language, stage.summary)}</p>
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
                      ? 'Si el worker todavía no ha endurecido el bloque, el commit no es durable y el cliente aún no debe recibir OK.'
                      : 'If the worker has not hardened the block yet, the commit is not durable and the client must not receive success.'
                    : activeStageData.id === 'log-flush'
                      ? language === 'es'
                        ? 'Aquí aparece WRITELOG: la latencia del dispositivo del log determina cuánto tarda el commit en salir.'
                        : 'This is where WRITELOG shows up: the log device latency decides how long the commit takes.'
                      : language === 'es'
                        ? 'Después de un crash, el motor escanea VLF por VLF para rehacer o deshacer lo necesario.'
                        : 'After a crash, the engine scans VLF by VLF to redo or undo what is required.'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-orange-300">{language === 'es' ? 'T-SQL de log listo para copiar' : 'Ready-to-paste log T-SQL'}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {language === 'es'
              ? 'Consulta tamaño activo del log, razón de truncado y recuento de VLFs sin salir de DMVs modernas.'
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
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">{language === 'es' ? 'Archivos virtuales de log (VLFs)' : 'Virtual Log Files'}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{language === 'es' ? 'Qué es un VLF y por qué demasiados rompen recovery' : 'What a VLF is and why too many hurt recovery'}</h3>
            <p className="mt-3 text-sm leading-7 text-white/72">
              {language === 'es'
                ? 'Un VLF no es otro archivo. Es una porción interna del mismo .ldf. SQL Server divide el log en varios VLFs para escribir, reutilizar y recorrer crash recovery por tramos.'
                : 'A VLF is not another file. It is an internal slice inside the same .ldf. SQL Server divides the log into multiple VLFs so it can write, reuse and scan crash recovery in chunks.'}
            </p>
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            {TLOG_VLF_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setActiveProfileId(profile.id)}
                className={cn('rounded-xl px-4 py-2 text-xs font-bold transition-all', activeProfileId === profile.id ? 'bg-orange-500/20 text-orange-300' : 'text-white/55 hover:bg-white/5 hover:text-white')}
              >
                {pick(language, profile.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_360px]">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">{language === 'es' ? '1. Dentro del .ldf' : '1. Inside the .ldf'}</div>
                <p className="mt-2 text-sm leading-6 text-white/75">{language === 'es' ? 'El log fisico es un solo archivo, pero internamente se trocea en VLFs.' : 'The physical log is a single file, but internally it is split into VLFs.'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">{language === 'es' ? '2. Cadena activa' : '2. Active chain'}</div>
                <p className="mt-2 text-sm leading-6 text-white/75">{language === 'es' ? 'Solo algunos VLFs contienen log activo. Esa cadena es la que recovery y backup deben recorrer.' : 'Only some VLFs contain active log. That chain is what recovery and backup must walk.'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">{language === 'es' ? '3. Growth importa' : '3. Growth matters'}</div>
                <p className="mt-2 text-sm leading-6 text-white/75">{language === 'es' ? 'Si el autogrowth es pequeño y repetido, acabas con muchos VLFs diminutos.' : 'If autogrowth is tiny and repeated, you end up with many tiny VLFs.'}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {VLF_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setActiveVlfAction(action.id)}
                  className={cn('rounded-xl border px-3 py-2 text-xs font-bold transition-all', activeVlfAction === action.id ? 'border-orange-500/30 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white')}
                >
                  {pick(language, action.label)}
                </button>
              ))}
              <button
                onClick={() => setIsVlfPlaying((current) => !current)}
                className={cn('ml-auto rounded-xl border px-3 py-2 text-xs font-bold transition-all', isVlfPlaying ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white')}
              >
                {isVlfPlaying ? <Pause className="mr-1 inline h-3.5 w-3.5" /> : <Play className="mr-1 inline h-3.5 w-3.5" />}
                {isVlfPlaying ? (language === 'es' ? 'Pausar' : 'Pause') : (language === 'es' ? 'Animar' : 'Animate')}
              </button>
              <button
                onClick={() => {
                  const resetVisual = buildVlfVisual(activeProfileId, activeVlfAction, 0);
                  setVlfFrame(0);
                  setSelectedVlfIndex(activeVlfAction === 'recover' ? resetVisual.scanAt : resetVisual.head);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
                {language === 'es' ? 'Reset visual' : 'Reset visual'}
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                <span>{pick(language, activeActionMeta.label)}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">{language === 'es' ? `${vlfVisual.reusableCount} reutilizables` : `${vlfVisual.reusableCount} reusable`}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">{language === 'es' ? `${vlfVisual.activeCount} activos` : `${vlfVisual.activeCount} active`}</span>
                {vlfVisual.growthCount > 0 && <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-rose-300">+{vlfVisual.growthCount} {language === 'es' ? 'nuevos' : 'new'}</span>}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/75">{pick(language, activeActionMeta.summary)}</p>
              <div className={cn('mt-4 grid gap-2', activeProfileId === 'healthy' ? 'grid-cols-7 md:grid-cols-10 xl:grid-cols-14' : 'grid-cols-6 md:grid-cols-8 xl:grid-cols-12')}>
                {vlfVisual.blocks.map((block) => (
                  <motion.button
                    key={`${activeProfile.id}-${block.id}`}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedVlfIndex(block.id)}
                    className={cn('rounded-xl border px-2 py-3 text-center text-[11px] font-bold transition-all', VLF_STATE_STYLE[block.state], selectedVlf.id === block.id && 'ring-2 ring-white/20')}
                  >
                    <div>{block.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">{language === 'es' ? 'Detalle del VLF seleccionado' : 'Selected VLF detail'}</div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-black text-white">{selectedVlf.label}</div>
                <p className="mt-2 text-sm leading-7 text-white/75">{language === 'es' ? 'Cada caja es una porción interna del mismo archivo de log.' : 'Each box is an internal slice of the same log file.'}</p>
              </div>
              <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', VLF_STATE_STYLE[selectedVlf.state])}>{stateLabel(language, selectedVlf.state)}</span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{language === 'es' ? 'Qué significa este estado' : 'What this state means'}</div>
              <p className="mt-3 text-sm leading-7 text-white/80">{stateDetail(language, selectedVlf.state)}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{language === 'es' ? 'Impacto inmediato' : 'Immediate impact'}</div>
              <p className="mt-3 text-sm leading-7 text-white/80">
                {activeVlfAction === 'write'
                  ? language === 'es'
                    ? 'El commit sigue esta cadena. Si el storage del log es lento, WRITELOG sube aunque el resto del motor esté sano.'
                    : 'Commit follows this chain. If log storage is slow, WRITELOG rises even when the rest of the engine is healthy.'
                  : activeVlfAction === 'truncate'
                    ? language === 'es'
                      ? 'Truncar no borra el archivo: libera VLFs viejos para que luego puedan reutilizarse.'
                      : 'Truncation does not delete the file: it frees old VLFs so they can be reused later.'
                    : activeVlfAction === 'recover'
                      ? language === 'es'
                        ? 'Recovery camina desde el inicio útil de la cadena activa hasta el final. Muchos VLFs pequeños implican más pasos.'
                        : 'Recovery walks from the useful start of the active chain to the end. Many tiny VLFs mean more steps.'
                      : language === 'es'
                        ? 'El growth pequeño crea más VLFs nuevos y deja una topología interna más fragmentada.'
                        : 'Tiny growth creates more new VLFs and leaves a more fragmented internal topology.'}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{language === 'es' ? 'Carga de recovery' : 'Recovery burden'}</div>
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div className={cn('h-3 rounded-full', activeProfile.id === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400')} style={{ width: `${activeProfile.id === 'healthy' ? 22 : 88}%` }} />
              </div>
              <p className="mt-3 text-xs leading-6 text-white/65">
                {activeProfile.id === 'healthy'
                  ? language === 'es'
                    ? 'Cadena corta y growth grande: recovery y log backup escanean menos nodos internos.'
                    : 'Short chain and larger growth: recovery and log backup scan fewer internal nodes.'
                  : language === 'es'
                    ? 'Cadena larga con muchos trozos pequeños: recovery, redo y arranque tardan más.'
                    : 'Long chain with many tiny pieces: recovery, redo and startup take longer.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {TLOG_VLF_PROFILES.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const tone = profile.id === 'healthy' ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-rose-500/25 bg-rose-500/8';
            return (
              <motion.button
                key={profile.id}
                whileHover={{ y: -2 }}
                onClick={() => setActiveProfileId(profile.id)}
                className={cn('rounded-3xl border p-5 text-left transition-all', tone, isActive ? 'shadow-[0_0_24px_rgba(255,255,255,0.05)]' : 'opacity-85')}
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
                <div className={cn('mt-5 grid gap-1 rounded-2xl border border-white/10 bg-black/30 p-3', profile.id === 'healthy' ? 'grid-cols-4' : 'grid-cols-12')}>
                  {Array.from({ length: profile.bars }, (_, index) => (
                    <motion.div
                      key={`${profile.id}-${index}`}
                      initial={{ opacity: 0.35 }}
                      animate={{ opacity: isActive ? 1 : 0.55, scaleY: isActive ? 1.04 : 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={cn('rounded-md', profile.id === 'healthy' ? 'h-7 bg-emerald-400/70' : 'h-4 bg-rose-400/70')}
                    />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.badges.map((badge) => (
                    <span
                      key={badge}
                      className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', profile.id === 'healthy' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-300')}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">{language === 'es' ? 'Impacto en crash recovery' : 'Crash recovery impact'}</div>
          <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeProfile.recovery)}</p>
          <p className="mt-4 text-sm leading-7 text-white/60">{pick(language, activeProfile.impact)}</p>
        </div>
      </div>
    </div>
  );
}
