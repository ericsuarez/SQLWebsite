import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Clock,
  CopyPlus,
  Cpu,
  Database,
  Lock,
  Play,
  Repeat,
  SkipForward,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { SYNC_PRIMITIVES, WAIT_CATEGORIES } from '../../data/advancedSQLData';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const THREAD_FLOW = [
  {
    id: 'compile',
    state: 'running',
    query: 'SELECT * FROM Sales WHERE OrderID = 42;',
    note: {
      es: 'El worker usa CPU para compilar o comenzar a ejecutar el plan.',
      en: 'The worker uses CPU to compile or begin executing the plan.',
    },
    queue: { runnable: 1, suspended: 0 },
  },
  {
    id: 'wait-io',
    state: 'suspended',
    query: 'PAGEIOLATCH_SH esperando que llegue la pagina desde disco.',
    note: {
      es: 'La pagina no esta en memoria. El worker se suspende y libera CPU.',
      en: 'The page is not in memory. The worker is suspended and frees the CPU.',
    },
    queue: { runnable: 0, suspended: 1 },
  },
  {
    id: 'back-queue',
    state: 'runnable',
    query: 'La I/O termina, el worker vuelve a la cola RUNNABLE.',
    note: {
      es: 'Ya tiene el recurso. Ahora espera turno de CPU en el scheduler.',
      en: 'The resource is ready. Now it waits for CPU time in the scheduler.',
    },
    queue: { runnable: 3, suspended: 0 },
  },
  {
    id: 'resume',
    state: 'running',
    query: 'El worker consume su quantum y termina el operador.',
    note: {
      es: 'Vuelve a RUNNING, consume quantum y continua hasta completar.',
      en: 'It returns to RUNNING, consumes quantum and continues until completion.',
    },
    queue: { runnable: 1, suspended: 0 },
  },
] as const;

const SYNC_SCRIPTS = {
  lock: `-- Cadena de bloqueo y SQL exacta
SELECT r.session_id,
       r.blocking_session_id,
       r.wait_type,
       r.wait_time,
       t.text AS sql_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id > 0;

-- Ver el bloqueo raiz y cortar si procede
KILL 52;`,
  latch: `-- Esperas de latch activas por tarea
SELECT wt.session_id,
       wt.wait_type,
       wt.wait_duration_ms,
       wt.resource_description
FROM sys.dm_os_waiting_tasks wt
WHERE wt.wait_type LIKE 'PAGELATCH%'
ORDER BY wt.wait_duration_ms DESC;

-- Correlacionar con TempDB o pagina caliente`,
  spinlock: `-- Estadisticas de spinlock
SELECT name,
       collisions,
       spins,
       sleep_time,
       backoffs
FROM sys.dm_os_spinlock_stats
ORDER BY backoffs DESC;`,
} as const;

const WAIT_SCRIPTS = {
  cpu: `SELECT scheduler_id,
       runnable_tasks_count,
       current_tasks_count,
       pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE';`,
  io: `SELECT wait_type,
       waiting_tasks_count,
       wait_time_ms
FROM sys.dm_os_wait_stats
WHERE wait_type IN ('PAGEIOLATCH_SH', 'WRITELOG', 'ASYNC_IO_COMPLETION')
ORDER BY wait_time_ms DESC;`,
  lock: `SELECT request_session_id,
       resource_type,
       request_mode,
       request_status
FROM sys.dm_tran_locks
ORDER BY request_session_id;`,
  network: `SELECT session_id,
       wait_type,
       wait_time,
       last_wait_type
FROM sys.dm_exec_requests
WHERE wait_type IN ('ASYNC_NETWORK_IO', 'OLEDB');`,
} as const;

export function SQLOSDeepDive() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'threads' | 'schedulers' | 'sync' | 'waits'>('threads');
  const [threadStepIndex, setThreadStepIndex] = useState(0);
  const [activeSyncId, setActiveSyncId] = useState<'lock' | 'latch' | 'spinlock'>('lock');
  const [activeWaitId, setActiveWaitId] = useState<(typeof WAIT_CATEGORIES)[number]['id']>('cpu');

  const activeThread = THREAD_FLOW[threadStepIndex];
  const activeSync = SYNC_PRIMITIVES.find((item) => item.id === activeSyncId) ?? SYNC_PRIMITIVES[0];
  const activeWait = WAIT_CATEGORIES.find((item) => item.id === activeWaitId) ?? WAIT_CATEGORIES[0];

  return (
    <div className="flex h-full flex-col gap-6 text-slate-200">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-3xl font-bold text-transparent">
              <Database className="h-8 w-8 text-violet-400" />
              {t('tabSqlOs')}
            </h2>
            <p className="max-w-5xl text-sm text-muted-foreground">{t('sqlosMainDesc')}</p>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex flex-wrap gap-2">
          {([
            { id: 'threads', icon: Activity, labelKey: 'sqlosTabThreads', color: 'text-emerald-400' },
            { id: 'schedulers', icon: Cpu, labelKey: 'sqlosTabSchedulers', color: 'text-indigo-400' },
            { id: 'sync', icon: Lock, labelKey: 'sqlosTabSync', color: 'text-rose-400' },
            { id: 'waits', icon: Clock, labelKey: 'sqlosTabWaits', color: 'text-amber-400' },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-all',
                  isActive
                    ? 'border-white/20 bg-white/10 text-white shadow-glow'
                    : 'border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? tab.color : 'text-white/40')} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'threads' && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_380px]">
            <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-emerald-400">{t('sqlosThreadsTitle')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t('sqlosThreadsDesc')}</p>
                </div>
                <button
                  onClick={() => setThreadStepIndex((current) => (current + 1) % THREAD_FLOW.length)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300"
                >
                  <Play className="h-4 w-4" />
                  {language === 'es' ? 'Siguiente estado' : 'Next state'}
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {THREAD_FLOW.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setThreadStepIndex(index)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-all',
                      index === threadStepIndex
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
                    )}
                  >
                    {index + 1}. {step.state}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {([
                  { id: 'running', label: t('sqlosRunning'), desc: t('sqlosRunningDesc'), color: 'emerald' },
                  { id: 'suspended', label: t('sqlosSuspended'), desc: t('sqlosSuspendedDesc'), color: 'rose' },
                  { id: 'runnable', label: t('sqlosRunnable'), desc: t('sqlosRunnableDesc'), color: 'amber' },
                ] as const).map((state) => {
                  const isActive = activeThread.state === state.id;
                  const style =
                    state.color === 'emerald'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : state.color === 'rose'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-300';

                  return (
                    <motion.div
                      key={state.id}
                      animate={isActive ? { y: [0, -4, 0] } : { y: 0 }}
                      transition={{ duration: 1.6, repeat: isActive ? Infinity : 0 }}
                      className={cn(
                        'rounded-3xl border p-5 transition-all',
                        isActive ? `${style} shadow-[0_0_24px_rgba(255,255,255,0.08)]` : 'border-white/10 bg-black/20'
                      )}
                    >
                      <div className="text-sm font-black uppercase tracking-[0.18em]">{state.label}</div>
                      <p className="mt-3 text-sm leading-relaxed text-white/75">{state.desc}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                  {language === 'es' ? 'Ruta actual de la query' : 'Current query path'}
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 font-mono text-sm text-emerald-300">
                  {activeThread.query}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="glass-panel rounded-3xl border border-white/10 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {language === 'es' ? 'Lo que ocurre ahora' : 'What happens now'}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  {language === 'es' ? activeThread.note.es : activeThread.note.en}
                </p>
              </div>

              <div className="glass-panel rounded-3xl border border-white/10 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {language === 'es' ? 'Cola del scheduler' : 'Scheduler queue'}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                    <div className="text-2xl font-black text-amber-300">{activeThread.queue.runnable}</div>
                    <div className="mt-1 text-xs text-white/50">RUNNABLE</div>
                  </div>
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-center">
                    <div className="text-2xl font-black text-rose-300">{activeThread.queue.suspended}</div>
                    <div className="mt-1 text-xs text-white/50">SUSPENDED</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedulers' && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
            <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-indigo-400">{t('sqlosSchedulersTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('sqlosSchedulersDesc')}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => {
                  const runnable = index === 2 ? 4 : index === 5 ? 2 : 0;
                  const active = index === 1 || index === 6;

                  return (
                    <div
                      key={index}
                      className={cn(
                        'rounded-2xl border p-4',
                        active ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-white/10 bg-black/20'
                      )}
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">Scheduler {index}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className={cn('h-3 w-3 rounded-full', active ? 'bg-emerald-400' : 'bg-white/20')} />
                        <span className="text-sm font-black text-indigo-300">{runnable} rq</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-5">
                  <div className="mb-2 flex items-center gap-2 text-indigo-300">
                    <Repeat className="h-5 w-5" />
                    <span className="font-bold">{t('nonPreemptiveTitle')}</span>
                  </div>
                  <p className="text-sm text-white/75">{t('nonPreemptiveDesc')}</p>
                </div>
                <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-5">
                  <div className="mb-2 flex items-center gap-2 text-indigo-300">
                    <SkipForward className="h-5 w-5" />
                    <span className="font-bold">{t('quantumTitle')}</span>
                  </div>
                  <p className="text-sm text-white/75">{t('quantumDesc')}</p>
                </div>
              </div>

              <div className="mt-6">
                <CopyCodeBlock
                  code={`SELECT scheduler_id,
       cpu_id,
       current_tasks_count,
       runnable_tasks_count,
       pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE';`}
                  accent="blue"
                />
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                {language === 'es' ? 'Lectura rapida' : 'Quick interpretation'}
              </p>
              <div className="mt-4 space-y-4 text-sm text-white/75">
                <p>
                  {language === 'es'
                    ? 'Si runnable_tasks_count crece y pending_disk_io_count no, el cuello es CPU o paralelismo.'
                    : 'If runnable_tasks_count grows and pending_disk_io_count does not, the bottleneck is CPU or parallelism.'}
                </p>
                <p>
                  {language === 'es'
                    ? 'Si hay poca CPU pero mucha cola RUNNABLE, revisa CPU Ready o afinidad.'
                    : 'If CPU looks free but the RUNNABLE queue is high, check CPU Ready or affinity.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="glass-panel rounded-3xl border border-white/10 p-4">
              <div className="grid gap-3">
                {SYNC_PRIMITIVES.map((primitive) => {
                  const isActive = primitive.id === activeSync.id;

                  return (
                    <button
                      key={primitive.id}
                      onClick={() => setActiveSyncId(primitive.id as 'lock' | 'latch' | 'spinlock')}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition-all',
                        isActive
                          ? 'border-rose-500/30 bg-rose-500/10 shadow-[0_0_24px_rgba(244,63,94,0.12)]'
                          : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="text-base font-bold text-white">{t(primitive.nameKey)}</div>
                      <div className="mt-2 text-xs text-white/50">{t(primitive.levelKey)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-rose-400">{t('sqlosSyncTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('sqlosSyncDesc')}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t('syncLevel')}</div>
                  <div className="mt-2 text-sm text-white/80">{t(activeSync.levelKey)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t('syncGranularity')}</div>
                  <div className="mt-2 text-sm text-white/80">{t(activeSync.granularityKey)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t('syncDuration')}</div>
                  <div className="mt-2 text-sm text-white/80">{t(activeSync.durationKey)}</div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
                <div className="mb-2 text-sm font-bold text-rose-300">
                  {language === 'es' ? 'Ejemplo visual' : 'Visual example'}
                </div>
                <p className="text-sm leading-relaxed text-white/80">{t(activeSync.exampleKey)}</p>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {language === 'es'
                    ? activeSync.id === 'lock'
                      ? 'T-SQL para ver el bloqueo y ejecutar KILL'
                      : 'T-SQL de diagnostico'
                    : activeSync.id === 'lock'
                      ? 'T-SQL to inspect the blocker and execute KILL'
                      : 'Diagnostic T-SQL'}
                </p>
                <CopyCodeBlock code={SYNC_SCRIPTS[activeSync.id as keyof typeof SYNC_SCRIPTS]} accent="rose" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'waits' && (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="glass-panel rounded-3xl border border-white/10 p-4">
              <div className="grid gap-3">
                {WAIT_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveWaitId(category.id)}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition-all',
                      category.id === activeWait.id
                        ? 'border-amber-500/30 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.12)]'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="text-base font-bold text-white">{t(category.nameKey)}</div>
                    <div className="mt-2 text-xs text-white/50">{t(category.descKey)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-amber-400">{t('sqlosWaitsTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(activeWait.descKey)}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {activeWait.waits.map((wait) => (
                  <div key={wait.name} className="rounded-3xl border border-white/10 bg-black/30 p-5">
                    <div className="font-mono text-sm font-black text-white">{wait.name}</div>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">{t(wait.descKey)}</p>
                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                      <span className="font-bold text-emerald-300">
                        {language === 'es' ? 'Que revisar:' : 'What to review:'}
                      </span>{' '}
                      {t(wait.fixKey)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <CopyCodeBlock code={WAIT_SCRIPTS[activeWait.id as keyof typeof WAIT_SCRIPTS]} accent="amber" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
