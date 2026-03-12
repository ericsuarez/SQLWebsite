import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Clock,
  Cpu,
  Database,
  Lock,
  Play,
  Pause,
  Repeat,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { SYNC_PRIMITIVES, WAIT_CATEGORIES } from '../../data/advancedSQLData';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

type LocalText = { en: string; es: string };
function pick(language: 'en' | 'es', text: LocalText) {
  return language === 'es' ? text.es : text.en;
}

type SchedulerProfileId = 'steady' | 'burst' | 'starved';
type SchedulerStat = {
  id: number;
  cpuId: number;
  online: boolean;
  runnable: number;
  current: number;
  pendingIo: number;
  quantumPct: number;
};

const SCHEDULER_PROFILES: { id: SchedulerProfileId; label: LocalText; desc: LocalText }[] = [
  {
    id: 'steady',
    label: { en: 'Steady', es: 'Estable' },
    desc: { en: 'Light workload with occasional runnable tasks.', es: 'Carga ligera con pocas tareas en RUNNABLE.' },
  },
  {
    id: 'burst',
    label: { en: 'Burst', es: 'Rafagas' },
    desc: { en: 'Short spikes: queues grow and shrink quickly.', es: 'Picos cortos: la cola crece y baja rapido.' },
  },
  {
    id: 'starved',
    label: { en: 'CPU Starved', es: 'CPU saturada' },
    desc: { en: 'RUNNABLE stays high: classic CPU pressure.', es: 'RUNNABLE se mantiene alto: presion real de CPU.' },
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hash01(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildSchedulerStats(profile: SchedulerProfileId, tick: number): SchedulerStat[] {
  const cfg =
    profile === 'steady'
      ? { base: 0, amp: 2, ioBase: 0, ioAmp: 1 }
      : profile === 'burst'
        ? { base: 1, amp: 7, ioBase: 0, ioAmp: 2 }
        : { base: 4, amp: 10, ioBase: 0, ioAmp: 1 };

  return Array.from({ length: 8 }).map((_, id) => {
    const online = true;
    const cpuId = id;
    const wave = Math.sin((tick + id * 0.7) / (profile === 'burst' ? 1.35 : 2.2));
    const jitter = (hash01(id * 37.7 + tick * 0.91) - 0.5) * 1.6;
    const runnable = clamp(Math.round(cfg.base + (cfg.amp * (wave + 1)) / 2 + jitter), 0, 14);
    const pendingIo = clamp(Math.round(cfg.ioBase + cfg.ioAmp * hash01(id * 13.3 + tick * 0.35)), 0, 6);
    const current = clamp(runnable + 1 + Math.round(hash01(id * 9.2 + tick * 0.44) * 2), 1, 18);
    const quantumPct = Math.round(hash01(id * 5.1 + tick * 1.11) * 100);

    return { id, cpuId, online, runnable, pendingIo, current, quantumPct };
  });
}

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

type LabStatus = 'running' | 'runnable' | 'suspended' | 'spinning' | 'done' | 'idle';
type LabSession = {
  spid: number;
  status: LabStatus;
  note: LocalText;
  waitType?: string;
  blockedBy?: number;
  holds?: string;
};
type LabResource = {
  title: LocalText;
  subtitle: LocalText;
  ownerSpid?: number;
  mode?: string;
  queue: number;
};
type LabStep = {
  id: string;
  headline: LocalText;
  detail: LocalText;
  sessions: LabSession[];
  resource: LabResource;
  metrics: { waitMs: number; collisions?: number; spins?: number };
};

const SYNC_LAB: Record<'lock' | 'latch' | 'spinlock', LabStep[]> = {
  lock: [
    {
      id: 'lock-acquire',
      headline: { en: 'Acquire the lock', es: 'Adquirir el lock' },
      detail: {
        en: 'SPID 52 starts a transaction and holds an X lock. Other sessions will queue behind it.',
        es: 'El SPID 52 inicia una transaccion y mantiene un lock X. El resto hara cola detras.',
      },
      sessions: [
        {
          spid: 52,
          status: 'running',
          holds: 'X',
          note: { en: 'BEGIN TRAN; UPDATE ... (holds X lock)', es: 'BEGIN TRAN; UPDATE ... (mantiene lock X)' },
        },
        { spid: 53, status: 'idle', note: { en: 'Waiting to run next statement', es: 'Lista para ejecutar la siguiente sentencia' } },
      ],
      resource: {
        title: { en: 'Row resource', es: 'Recurso de fila' },
        subtitle: { en: 'Orders(OrderID=1001)', es: 'Orders(OrderID=1001)' },
        ownerSpid: 52,
        mode: 'X',
        queue: 0,
      },
      metrics: { waitMs: 0 },
    },
    {
      id: 'lock-blocked',
      headline: { en: 'Blocked session appears', es: 'Aparece la sesion bloqueada' },
      detail: {
        en: 'SPID 53 hits the same row and becomes SUSPENDED on LCK_M_X (blocked by 52).',
        es: 'El SPID 53 intenta la misma fila y queda SUSPENDED en LCK_M_X (bloqueado por 52).',
      },
      sessions: [
        {
          spid: 52,
          status: 'running',
          holds: 'X',
          note: { en: 'Still inside the transaction', es: 'Sigue dentro de la transaccion' },
        },
        {
          spid: 53,
          status: 'suspended',
          waitType: 'LCK_M_X',
          blockedBy: 52,
          note: { en: 'Waiting for X lock to be released', es: 'Esperando a que se libere el lock X' },
        },
      ],
      resource: {
        title: { en: 'Row resource', es: 'Recurso de fila' },
        subtitle: { en: 'Orders(OrderID=1001)', es: 'Orders(OrderID=1001)' },
        ownerSpid: 52,
        mode: 'X',
        queue: 1,
      },
      metrics: { waitMs: 12400 },
    },
    {
      id: 'lock-resolve',
      headline: { en: 'Resolve: COMMIT or KILL', es: 'Resolver: COMMIT o KILL' },
      detail: {
        en: 'After COMMIT (or KILL in emergencies), SPID 53 returns to RUNNABLE and can complete.',
        es: 'Tras COMMIT (o KILL en emergencias), el SPID 53 vuelve a RUNNABLE y puede terminar.',
      },
      sessions: [
        { spid: 52, status: 'done', note: { en: 'Transaction ended', es: 'Transaccion finalizada' } },
        { spid: 53, status: 'runnable', note: { en: 'Back to the runnable queue', es: 'Vuelve a la cola RUNNABLE' } },
      ],
      resource: {
        title: { en: 'Row resource', es: 'Recurso de fila' },
        subtitle: { en: 'Orders(OrderID=1001)', es: 'Orders(OrderID=1001)' },
        ownerSpid: 53,
        mode: 'X',
        queue: 0,
      },
      metrics: { waitMs: 65 },
    },
  ],
  latch: [
    {
      id: 'latch-hot',
      headline: { en: 'A hot page becomes a bottleneck', es: 'Una pagina caliente se convierte en cuello' },
      detail: {
        en: 'Multiple workers attempt to update the same in-memory structure. They queue on PAGELATCH_EX.',
        es: 'Varios workers intentan actualizar la misma estructura en memoria. Hacen cola en PAGELATCH_EX.',
      },
      sessions: [
        { spid: 60, status: 'running', note: { en: 'Holds the latch briefly', es: 'Mantiene el latch un instante' } },
        { spid: 61, status: 'suspended', waitType: 'PAGELATCH_EX', note: { en: 'Waiting for latch', es: 'Esperando el latch' } },
        { spid: 62, status: 'suspended', waitType: 'PAGELATCH_EX', note: { en: 'Waiting for latch', es: 'Esperando el latch' } },
      ],
      resource: {
        title: { en: 'Hot page', es: 'Pagina caliente' },
        subtitle: { en: 'hot page (generic example)', es: 'pagina caliente (ejemplo generico)' },
        ownerSpid: 60,
        mode: 'EX',
        queue: 2,
      },
      metrics: { waitMs: 850 },
    },
    {
      id: 'latch-fix',
      headline: { en: 'Reduce contention', es: 'Reducir la contencion' },
      detail: {
        en: 'Spread allocation and hotspots (more TempDB data files, tune schema, avoid last-page inserts).',
        es: 'Reparte hotspots (mas datafiles en TempDB, ajustar esquema, evitar last-page inserts).',
      },
      sessions: [
        { spid: 60, status: 'running', note: { en: 'Work completes', es: 'El trabajo progresa' } },
        { spid: 61, status: 'running', note: { en: 'No longer queued', es: 'Ya no hace cola' } },
        { spid: 62, status: 'running', note: { en: 'No longer queued', es: 'Ya no hace cola' } },
      ],
      resource: {
        title: { en: 'Hot page', es: 'Pagina caliente' },
        subtitle: { en: 'contention diffused', es: 'contencion difuminada' },
        ownerSpid: 60,
        mode: 'EX',
        queue: 0,
      },
      metrics: { waitMs: 40 },
    },
  ],
  spinlock: [
    {
      id: 'spin-hot',
      headline: { en: 'Spinlock saturation', es: 'Saturacion de spinlock' },
      detail: {
        en: 'Workers spin in CPU while trying to enter a tiny critical section. Collisions and spins climb fast.',
        es: 'Los workers hacen spin en CPU para entrar en una seccion critica pequena. Suben colisiones y spins.',
      },
      sessions: [
        { spid: 71, status: 'running', note: { en: 'Inside critical section', es: 'Dentro de la seccion critica' } },
        { spid: 72, status: 'spinning', waitType: 'SPIN', note: { en: 'Spinning (burning CPU)', es: 'Haciendo spin (quema CPU)' } },
        { spid: 73, status: 'spinning', waitType: 'SPIN', note: { en: 'Spinning (burning CPU)', es: 'Haciendo spin (quema CPU)' } },
        { spid: 74, status: 'spinning', waitType: 'SPIN', note: { en: 'Spinning (burning CPU)', es: 'Haciendo spin (quema CPU)' } },
      ],
      resource: {
        title: { en: 'Spinlock', es: 'Spinlock' },
        subtitle: { en: 'SOS_CACHESTORE (example)', es: 'SOS_CACHESTORE (ejemplo)' },
        ownerSpid: 71,
        mode: 'Spin',
        queue: 3,
      },
      metrics: { waitMs: 0, collisions: 4500, spins: 110000 },
    },
    {
      id: 'spin-fix',
      headline: { en: 'Partition or reduce concurrency', es: 'Particionar o reducir concurrencia' },
      detail: {
        en: 'After removing the hotspot, collisions drop and CPU is used for real work again.',
        es: 'Tras eliminar el hotspot, bajan colisiones y la CPU vuelve al trabajo util.',
      },
      sessions: [
        { spid: 71, status: 'running', note: { en: 'Critical section is short', es: 'Seccion critica corta' } },
        { spid: 72, status: 'running', note: { en: 'No spin', es: 'Sin spin' } },
        { spid: 73, status: 'idle', note: { en: 'Idle', es: 'Idle' } },
        { spid: 74, status: 'idle', note: { en: 'Idle', es: 'Idle' } },
      ],
      resource: {
        title: { en: 'Spinlock', es: 'Spinlock' },
        subtitle: { en: 'hotspot removed', es: 'hotspot eliminado' },
        ownerSpid: 71,
        mode: 'Spin',
        queue: 0,
      },
      metrics: { waitMs: 0, collisions: 220, spins: 3400 },
    },
  ],
};

const WAIT_LAB_VALUES: Record<
  string,
  { beforeMs: number; afterMs: number; beforeTasks: number; afterTasks: number; signalPct: number }
> = {
  SOS_SCHEDULER_YIELD: { beforeMs: 180000, afterMs: 45000, beforeTasks: 2400, afterTasks: 800, signalPct: 22 },
  CXPACKET: { beforeMs: 120000, afterMs: 55000, beforeTasks: 820, afterTasks: 420, signalPct: 18 },
  THREADPOOL: { beforeMs: 95000, afterMs: 12000, beforeTasks: 260, afterTasks: 40, signalPct: 8 },
  PAGEIOLATCH_SH: { beforeMs: 820000, afterMs: 110000, beforeTasks: 9100, afterTasks: 1300, signalPct: 6 },
  WRITELOG: { beforeMs: 510000, afterMs: 90000, beforeTasks: 4200, afterTasks: 900, signalPct: 4 },
  ASYNC_IO_COMPLETION: { beforeMs: 260000, afterMs: 70000, beforeTasks: 1600, afterTasks: 520, signalPct: 5 },
  LCK_M_X: { beforeMs: 420000, afterMs: 140000, beforeTasks: 3800, afterTasks: 1100, signalPct: 3 },
  LCK_M_S: { beforeMs: 210000, afterMs: 85000, beforeTasks: 1900, afterTasks: 700, signalPct: 3 },
  PAGELATCH_EX: { beforeMs: 330000, afterMs: 65000, beforeTasks: 2700, afterTasks: 600, signalPct: 2 },
  ASYNC_NETWORK_IO: { beforeMs: 160000, afterMs: 90000, beforeTasks: 700, afterTasks: 420, signalPct: 10 },
  OLEDB: { beforeMs: 120000, afterMs: 95000, beforeTasks: 300, afterTasks: 260, signalPct: 9 },
};

const LAB_STATUS_STYLE: Record<LabStatus, string> = {
  running: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  runnable: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  suspended: 'border-rose-500/30 bg-rose-500/10 text-rose-200 animate-pulse',
  spinning: 'border-violet-500/30 bg-violet-500/10 text-violet-200 animate-pulse',
  done: 'border-white/10 bg-white/5 text-white/65',
  idle: 'border-white/10 bg-black/20 text-white/45',
};

const LAB_STATUS_LABEL: Record<LabStatus, LocalText> = {
  running: { en: 'RUNNING', es: 'RUNNING' },
  runnable: { en: 'RUNNABLE', es: 'RUNNABLE' },
  suspended: { en: 'SUSPENDED', es: 'SUSPENDED' },
  spinning: { en: 'SPINNING', es: 'SPINNING' },
  done: { en: 'DONE', es: 'DONE' },
  idle: { en: 'IDLE', es: 'IDLE' },
};

export function SQLOSDeepDive() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'threads' | 'schedulers' | 'sync' | 'waits'>('threads');
  const [threadStepIndex, setThreadStepIndex] = useState(0);
  const [threadPlaying, setThreadPlaying] = useState(false);
  const [activeSyncId, setActiveSyncId] = useState<'lock' | 'latch' | 'spinlock'>('lock');
  const [activeWaitId, setActiveWaitId] = useState<(typeof WAIT_CATEGORIES)[number]['id']>('cpu');
  const [schedulerProfile, setSchedulerProfile] = useState<SchedulerProfileId>('steady');
  const [schedulerPlaying, setSchedulerPlaying] = useState(true);
  const [schedulerTick, setSchedulerTick] = useState(0);
  const [selectedSchedulerId, setSelectedSchedulerId] = useState(2);
  const [syncStepIndex, setSyncStepIndex] = useState(0);
  const [waitScenario, setWaitScenario] = useState<'before' | 'after'>('before');
  const [selectedWaitName, setSelectedWaitName] = useState(() => WAIT_CATEGORIES[0]?.waits[0]?.name ?? '');

  const activeThread = THREAD_FLOW[threadStepIndex];
  const activeSync = SYNC_PRIMITIVES.find((item) => item.id === activeSyncId) ?? SYNC_PRIMITIVES[0];
  const activeWait = WAIT_CATEGORIES.find((item) => item.id === activeWaitId) ?? WAIT_CATEGORIES[0];
  const schedulerStats = useMemo(
    () => buildSchedulerStats(schedulerProfile, schedulerTick),
    [schedulerProfile, schedulerTick]
  );
  const selectedScheduler = schedulerStats.find((row) => row.id === selectedSchedulerId) ?? schedulerStats[0];
  const schedulerHint: LocalText =
    selectedScheduler.pendingIo >= 3
      ? {
          en: 'Pending I/O is high. Expect storage latency, WRITELOG/PAGEIOLATCH, or saturated virtual storage paths.',
          es: 'Hay mucha I/O pendiente. Sospecha latencia de almacenamiento, WRITELOG/PAGEIOLATCH o ruta virtual saturada.',
        }
      : selectedScheduler.runnable >= 6
        ? {
            en: 'RUNNABLE is consistently high. This is classic CPU pressure (or CPU Ready/affinity issues).',
            es: 'RUNNABLE se mantiene alto. Senal clasica de presion de CPU (o CPU Ready/afinidad).',
          }
        : {
            en: 'Queues look healthy. If the query is slow, correlate with waits and plan shape (CXPACKET, memory grants, spills).',
            es: 'La cola se ve sana. Si va lento, correlaciona con waits y con el plan (CXPACKET, grants, spills).',
          };
  const syncSteps = SYNC_LAB[activeSyncId];
  const syncStep = syncSteps[syncStepIndex] ?? syncSteps[0];
  const waitBreakdown = useMemo(() => {
    const rows = activeWait.waits.map((wait) => {
      const sample = WAIT_LAB_VALUES[wait.name] ?? {
        beforeMs: 80000,
        afterMs: 30000,
        beforeTasks: 420,
        afterTasks: 160,
        signalPct: 12,
      };
      const waitMs = waitScenario === 'before' ? sample.beforeMs : sample.afterMs;
      const tasks = waitScenario === 'before' ? sample.beforeTasks : sample.afterTasks;
      const signalMs = Math.max(0, Math.round((waitMs * sample.signalPct) / 100));
      const resourceMs = Math.max(0, waitMs - signalMs);
      return { ...wait, waitMs, tasks, signalMs, resourceMs };
    });

    const totalMs = rows.reduce((acc, row) => acc + row.waitMs, 0);
    return {
      totalMs,
      rows: rows.map((row) => ({ ...row, pct: totalMs > 0 ? (row.waitMs / totalMs) * 100 : 0 })),
    };
  }, [activeWait.id, waitScenario]);
  const selectedWait = activeWait.waits.find((wait) => wait.name === selectedWaitName) ?? activeWait.waits[0];
  const selectedWaitRow = waitBreakdown.rows.find((row) => row.name === selectedWait?.name) ?? waitBreakdown.rows[0];

  useEffect(() => {
    setSyncStepIndex(0);
  }, [activeSyncId]);

  useEffect(() => {
    const first = activeWait.waits[0]?.name;
    if (first) setSelectedWaitName(first);
  }, [activeWait.id]);

  useEffect(() => {
    if (activeTab !== 'schedulers' || !schedulerPlaying) return;
    const handle = window.setInterval(() => setSchedulerTick((t) => t + 1), 900);
    return () => window.clearInterval(handle);
  }, [activeTab, schedulerPlaying]);

  useEffect(() => {
    if (activeTab !== 'threads' || !threadPlaying) return;
    const handle = window.setInterval(() => {
      setThreadStepIndex((current) => (current + 1) % THREAD_FLOW.length);
    }, 2200);
    return () => window.clearInterval(handle);
  }, [activeTab, threadPlaying]);

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setThreadPlaying(false);
                      setThreadStepIndex((current) => (current + 1) % THREAD_FLOW.length);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300"
                  >
                    <SkipForward className="h-4 w-4" />
                    {language === 'es' ? 'Paso' : 'Step'}
                  </button>
                  <button
                    onClick={() => setThreadPlaying((v) => !v)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-all',
                      threadPlaying
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
                        : 'border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5 hover:text-white'
                    )}
                    title={language === 'es' ? 'Auto-play de estados' : 'Autoplay thread states'}
                  >
                    {threadPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {language === 'es' ? 'Auto' : 'Auto'}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {THREAD_FLOW.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setThreadPlaying(false);
                      setThreadStepIndex(index);
                    }}
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

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5 overflow-hidden">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {language === 'es' ? 'Maquina de estados (visual)' : 'State machine (visual)'}
                </p>
                <div className="mt-4 relative">
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: 'running', label: 'RUNNING', sub: 'CPU', tone: 'emerald' },
                      { id: 'suspended', label: 'SUSPENDED', sub: 'WAIT', tone: 'rose' },
                      { id: 'runnable', label: 'RUNNABLE', sub: 'QUEUE', tone: 'amber' },
                    ] as const).map((node) => {
                      const isActive = activeThread.state === node.id;
                      const tone =
                        node.tone === 'emerald'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : node.tone === 'rose'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-200';
                      return (
                        <div
                          key={node.id}
                          className={cn(
                            'rounded-3xl border p-4 transition-all',
                            isActive ? tone : 'border-white/10 bg-black/20 text-white/60'
                          )}
                        >
                          <div className="text-xs font-black uppercase tracking-[0.18em]">{node.label}</div>
                          <div className="mt-2 text-[11px] font-mono text-white/50">{node.sub}</div>
                        </div>
                      );
                    })}
                  </div>

                  <motion.div
                    className="absolute top-7 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.22)]"
                    style={{ transform: 'translate(-50%, -50%)' }}
                    animate={{
                      left:
                        activeThread.state === 'running'
                          ? '16.666%'
                          : activeThread.state === 'suspended'
                            ? '50%'
                            : '83.333%',
                    }}
                    transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                  />
                </div>
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-indigo-400">{t('sqlosSchedulersTitle')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t('sqlosSchedulersDesc')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSchedulerPlaying((v) => !v)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition-all',
                      schedulerPlaying
                        ? 'border-indigo-500/30 bg-indigo-500/15 text-indigo-200'
                        : 'border-white/10 bg-black/20 text-muted-foreground hover:bg-white/5 hover:text-white'
                    )}
                    title={language === 'es' ? 'Animar cola de schedulers' : 'Animate scheduler queues'}
                  >
                    {schedulerPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {language === 'es' ? 'Animacion' : 'Animate'}
                  </button>
                  <button
                    onClick={() => setSchedulerTick(0)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-white/70 transition-all hover:bg-white/5 hover:text-white"
                    title={language === 'es' ? 'Reiniciar simulacion' : 'Reset simulation'}
                  >
                    <Repeat className="h-4 w-4" />
                    {language === 'es' ? 'Reset' : 'Reset'}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex gap-1 rounded-2xl border border-white/10 bg-black/20 p-1">
                  {SCHEDULER_PROFILES.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSchedulerProfile(profile.id)}
                      className={cn(
                        'rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all',
                        schedulerProfile === profile.id
                          ? 'bg-indigo-500/20 text-indigo-200'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {pick(language, profile.label)}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-white/55">
                  {pick(language, (SCHEDULER_PROFILES.find((p) => p.id === schedulerProfile) ?? SCHEDULER_PROFILES[0]).desc)}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {schedulerStats.map((row) => {
                  const isSelected = row.id === selectedSchedulerId;
                  const isBusy = row.runnable >= 6;
                  const runnablePct = (clamp(row.runnable, 0, 14) / 14) * 100;
                  const ioPct = (clamp(row.pendingIo, 0, 6) / 6) * 100;

                  return (
                    <motion.button
                      key={row.id}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedSchedulerId(row.id)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition-all',
                        isSelected
                          ? 'border-indigo-400/50 bg-indigo-500/10 shadow-[0_0_24px_rgba(99,102,241,0.18)]'
                          : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">SOS {row.id}</div>
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-mono text-white/60">
                          CPU {row.cpuId}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className={cn('h-3 w-3 rounded-full', row.online ? (isBusy ? 'bg-rose-400' : 'bg-emerald-400') : 'bg-white/20')} />
                        <span className={cn('text-sm font-black', isBusy ? 'text-rose-200' : 'text-indigo-200')}>
                          {row.runnable} rq
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            animate={{ width: `${runnablePct}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            className={cn('h-2 rounded-full', isBusy ? 'bg-rose-500/80' : 'bg-indigo-500/80')}
                          />
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            animate={{ width: `${ioPct}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            className="h-1.5 rounded-full bg-sky-400/70"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-white/55">
                        <span>io {row.pendingIo}</span>
                        <span>tasks {row.current}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-200/70">
                      {language === 'es' ? 'Scheduler seleccionado' : 'Selected scheduler'}
                    </p>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold text-white/75">
                      rq={selectedScheduler.runnable} io={selectedScheduler.pendingIo}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-base font-black text-white">SOS {selectedScheduler.id}</div>
                    <div className="text-xs font-mono text-white/50">tick {schedulerTick}</div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between text-xs text-white/55">
                      <span>{language === 'es' ? 'RUNNABLE queue' : 'RUNNABLE queue'}</span>
                      <span className="font-mono">{selectedScheduler.runnable}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <AnimatePresence initial={false}>
                        {Array.from({ length: Math.min(selectedScheduler.runnable, 14) }).map((_, idx) => (
                          <motion.div
                            key={`rq-${selectedScheduler.id}-${selectedScheduler.runnable}-${idx}`}
                            layout
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-[0_0_14px_rgba(245,158,11,0.22)]"
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-white/55">
                      <span>{t('quantumTitle')}</span>
                      <span className="font-mono">{selectedScheduler.quantumPct}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-2 rounded-full bg-indigo-500/80"
                        animate={{ width: `${selectedScheduler.quantumPct}%` }}
                        transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-5">
                  <div className="mb-2 flex items-center gap-2 text-indigo-300">
                    <SkipForward className="h-5 w-5" />
                    <span className="font-bold">{t('nonPreemptiveTitle')}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/75">{t('nonPreemptiveDesc')}</p>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/75">
                    <span className="font-bold text-indigo-200">{language === 'es' ? 'Idea:' : 'Idea:'}</span>{' '}
                    {language === 'es'
                      ? 'Cuando un worker se queda sin CPU, lo veras como cola RUNNABLE y waits de CPU.'
                      : 'When workers cannot get CPU, it shows up as RUNNABLE queue growth and CPU-related waits.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                {language === 'es' ? 'Diagnostico rapido' : 'Quick diagnosis'}
              </p>

              <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-indigo-200">Scheduler {selectedScheduler.id}</div>
                    <div className="mt-1 text-xs text-white/55">cpu_id={selectedScheduler.cpuId}</div>
                  </div>
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-200">
                    {pick(language, schedulerHint).includes('I/O') ? 'I/O' : selectedScheduler.runnable >= 6 ? 'CPU' : 'OK'}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/80">{pick(language, schedulerHint)}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    ['runnable_tasks_count', selectedScheduler.runnable],
                    ['pending_disk_io_count', selectedScheduler.pendingIo],
                    ['current_tasks_count', selectedScheduler.current],
                  ].map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-white/75"
                    >
                      {k}: <span className="font-mono text-white">{v}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  {language === 'es' ? 'DMV (copiar y pegar)' : 'DMV (copy/paste)'}
                </p>
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
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
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
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-base font-bold text-white">{t(primitive.nameKey as any)}</div>
                        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-bold text-white/70">
                          {primitive.id.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-white/50">{t(primitive.levelKey as any)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-rose-400">{t('sqlosSyncTitle')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t('sqlosSyncDesc')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSyncStepIndex((current) => (current + 1) % syncSteps.length)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-200"
                  >
                    <Play className="h-4 w-4" />
                    {language === 'es' ? 'Siguiente evento' : 'Next event'}
                  </button>
                  <button
                    onClick={() => setSyncStepIndex(0)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-white/70 transition-all hover:bg-white/5 hover:text-white"
                  >
                    <Repeat className="h-4 w-4" />
                    {language === 'es' ? 'Reset' : 'Reset'}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {syncSteps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setSyncStepIndex(index)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-all',
                      index === syncStepIndex
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                        : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-rose-300" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                            {language === 'es' ? 'Laboratorio' : 'Lab'}
                          </p>
                          <div className="mt-2 text-lg font-black text-white">{pick(language, syncStep.headline)}</div>
                        </div>
                      </div>
                      <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[11px] font-bold text-rose-200">
                        {syncStep.metrics.waitMs}ms
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/80">{pick(language, syncStep.detail)}</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                      {pick(language, syncStep.resource.title)}
                    </p>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-mono text-sm font-black text-white">{pick(language, syncStep.resource.subtitle)}</div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold text-white/70">
                            {language === 'es' ? 'Owner' : 'Owner'}: {syncStep.resource.ownerSpid ? `SPID ${syncStep.resource.ownerSpid}` : '-'}
                          </span>
                          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold text-white/70">
                            {language === 'es' ? 'Modo' : 'Mode'}: {syncStep.resource.mode ?? '-'}
                          </span>
                          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold text-white/70">
                            queue: {syncStep.resource.queue}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <AnimatePresence initial={false}>
                          {Array.from({ length: Math.min(syncStep.resource.queue, 16) }).map((_, idx) => (
                            <motion.div
                              key={`q-${syncStep.id}-${syncStep.resource.queue}-${idx}`}
                              layout
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              className="h-2.5 w-2.5 rounded-full bg-rose-400/80 shadow-[0_0_14px_rgba(244,63,94,0.22)]"
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t('syncLevel')}</div>
                        <div className="mt-2 text-sm text-white/80">{t(activeSync.levelKey as any)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t('syncGranularity')}</div>
                        <div className="mt-2 text-sm text-white/80">{t(activeSync.granularityKey as any)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{t('syncDuration')}</div>
                        <div className="mt-2 text-sm text-white/80">{t(activeSync.durationKey as any)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
                    <div className="mb-2 text-sm font-bold text-rose-200">
                      {language === 'es' ? 'Interpretacion rapida' : 'Quick interpretation'}
                    </div>
                    <p className="text-sm leading-relaxed text-white/80">{t(activeSync.exampleKey as any)}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                    {language === 'es' ? 'Sesiones / workers' : 'Sessions / workers'}
                  </p>
                  <div className="mt-4 space-y-3">
                    <AnimatePresence initial={false}>
                      {syncStep.sessions.map((session) => (
                        <motion.div
                          key={`${syncStep.id}-${session.spid}`}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className={cn('rounded-2xl border p-4', LAB_STATUS_STYLE[session.status])}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-mono text-sm font-black text-white">SPID {session.spid}</div>
                            <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black tracking-[0.14em] text-white/70">
                              {pick(language, LAB_STATUS_LABEL[session.status])}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                            {session.holds && (
                              <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-white/75">
                                holds={session.holds}
                              </span>
                            )}
                            {session.waitType && (
                              <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-rose-200">
                                wait={session.waitType}
                              </span>
                            )}
                            {session.blockedBy && (
                              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-200">
                                blocked_by={session.blockedBy}
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-white/75">{pick(language, session.note)}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {(syncStep.metrics.collisions !== undefined || syncStep.metrics.spins !== undefined) && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                        {language === 'es' ? 'Metricas' : 'Metrics'}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                          <div className="text-xs text-white/50">collisions</div>
                          <div className="mt-1 font-mono text-sm font-black text-violet-200">{syncStep.metrics.collisions ?? '-'}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                          <div className="text-xs text-white/50">spins</div>
                          <div className="mt-1 font-mono text-sm font-black text-violet-200">{syncStep.metrics.spins ?? '-'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                    <div className="text-base font-bold text-white">{t(category.nameKey as any)}</div>
                    <div className="mt-2 text-xs text-white/50">{t(category.descKey as any)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-amber-400">{t('sqlosWaitsTitle')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(activeWait.descKey as any)}</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
                  <button
                    onClick={() => setWaitScenario('before')}
                    className={cn(
                      'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all',
                      waitScenario === 'before'
                        ? 'bg-amber-500/20 text-amber-200'
                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {language === 'es' ? 'Antes' : 'Before'}
                  </button>
                  <button
                    onClick={() => setWaitScenario('after')}
                    className={cn(
                      'rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all',
                      waitScenario === 'after'
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {language === 'es' ? 'Despues' : 'After'}
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                      {language === 'es' ? 'Distribucion de waits (top)' : 'Wait breakdown (top)'}
                    </p>
                    <div className="mt-2 text-sm text-white/70">
                      {language === 'es'
                        ? `Total wait_time: ${waitBreakdown.totalMs.toLocaleString()} ms`
                        : `Total wait_time: ${waitBreakdown.totalMs.toLocaleString()} ms`}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/75">
                      {language === 'es' ? 'Seleccionado' : 'Selected'}: <span className="font-mono text-white">{selectedWaitRow?.name}</span>
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/75">
                      wait_time_ms: <span className="font-mono text-white">{selectedWaitRow?.waitMs?.toLocaleString?.() ?? '-'}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-10 rounded-2xl border border-white/10 bg-black/25 overflow-hidden flex">
                  {waitBreakdown.rows.map((row, index) => {
                    const palette = ['bg-amber-500/80', 'bg-sky-500/80', 'bg-rose-500/80', 'bg-emerald-500/80', 'bg-violet-500/80'] as const;
                    const seg = palette[index % palette.length];
                    const isActive = row.name === selectedWaitName;
                    const showLabel = row.pct >= 28;
                    return (
                      <motion.button
                        key={`${activeWait.id}-${row.name}`}
                        onClick={() => setSelectedWaitName(row.name)}
                        animate={{ width: `${row.pct}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        className={cn(
                          'h-full relative group',
                          seg,
                          isActive ? 'ring-2 ring-white/60 ring-inset' : 'opacity-80 hover:opacity-100'
                        )}
                        title={row.name}
                      >
                        {showLabel && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-[0.14em] text-black/85 drop-shadow">
                            {row.name}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                    <div className="font-mono text-sm font-black text-white">{selectedWait?.name}</div>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">{t(selectedWait?.descKey as any)}</p>
                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                      <span className="font-bold text-emerald-300">
                        {language === 'es' ? 'Que revisar:' : 'What to review:'}
                      </span>{' '}
                      {t(selectedWait?.fixKey as any)}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5 overflow-hidden">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                        sys.dm_os_wait_stats (muestra)
                      </p>
                      <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold text-white/70">
                        {language === 'es' ? 'clic para seleccionar' : 'click to select'}
                      </span>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-white/50">
                          <tr className="border-b border-white/10">
                            <th className="py-2 pr-2 font-bold">wait_type</th>
                            <th className="py-2 pr-2 font-bold">wait_time_ms</th>
                            <th className="py-2 pr-2 font-bold">signal_ms</th>
                            <th className="py-2 pr-2 font-bold">tasks</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono">
                          {waitBreakdown.rows.map((row) => {
                            const isRowActive = row.name === selectedWaitName;
                            return (
                              <tr
                                key={`row-${activeWait.id}-${row.name}`}
                                onClick={() => setSelectedWaitName(row.name)}
                                className={cn(
                                  'border-b border-white/5 cursor-pointer transition-colors',
                                  isRowActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                                )}
                              >
                                <td className="py-2 pr-2 text-white">{row.name}</td>
                                <td className="py-2 pr-2 text-white/75">{row.waitMs.toLocaleString()}</td>
                                <td className="py-2 pr-2 text-white/60">{row.signalMs.toLocaleString()}</td>
                                <td className="py-2 pr-2 text-white/60">{row.tasks.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
