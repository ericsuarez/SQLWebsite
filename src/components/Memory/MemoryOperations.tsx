import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  Zap,
  Cpu,
  Archive,
  LayoutDashboard,
  SearchCode,
  Code2,
  Sliders,
  PieChart,
  AlertTriangle,
  FlaskConical,
  Gauge,
  Server,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

interface Page {
  id: number;
  state: 'clean' | 'dirty' | 'free';
  data: string;
}

type LocalText = { es: string; en: string };
type ClerkAccent = 'emerald' | 'cyan' | 'blue' | 'rose' | 'amber' | 'violet';

interface MemoryClerkDef {
  id: string;
  name: string;
  share: number;
  accent: ClerkAccent;
  title: LocalText;
  summary: LocalText;
  signal: LocalText;
  labHint: LocalText;
  script: string;
}

interface ClerkLab {
  id: string;
  title: LocalText;
  objective: LocalText;
  steps: LocalText[];
  focusClerkId: MemoryClerkDef['id'];
  diagnosticScript: string;
  remediationScript: string;
}

interface MemoryPreset {
  id: string;
  label: LocalText;
  desc: LocalText;
  min: number;
  max: number;
}

const MEMORY_CLERKS: MemoryClerkDef[] = [
  {
    id: 'bufferpool',
    name: 'MEMORYCLERK_SQLBUFFERPOOL',
    share: 55,
    accent: 'emerald',
    title: { es: 'Buffer Pool', en: 'Buffer Pool' },
    summary: {
      es: 'Paginas de datos e indices mantenidas en RAM para evitar I/O fisico.',
      en: 'Data and index pages kept in RAM to avoid physical I/O.',
    },
    signal: {
      es: 'Baja PLE + PAGEIOLATCH_SH altos suelen apuntar aqui.',
      en: 'Low PLE + high PAGEIOLATCH_SH often points here.',
    },
    labHint: {
      es: 'Correlaciona con DBCC DROPCLEANBUFFERS en laboratorio y mide la recuperacion de cache.',
      en: 'Correlate with DBCC DROPCLEANBUFFERS in lab and measure cache recovery.',
    },
    script: `SELECT TOP 20
  type,
  SUM(pages_kb) / 1024 AS used_mb
FROM sys.dm_os_memory_clerks
WHERE type = 'MEMORYCLERK_SQLBUFFERPOOL'
GROUP BY type;`,
  },
  {
    id: 'sqlcp',
    name: 'CACHESTORE_SQLCP',
    share: 10,
    accent: 'cyan',
    title: { es: 'Plan Cache ad-hoc', en: 'Ad-hoc plan cache' },
    summary: {
      es: 'Planes compilados de consultas individuales. Si crece demasiado, suele oler a mala parametrizacion.',
      en: 'Compiled plans for individual queries. If it grows too much, it usually means poor parameterization.',
    },
    signal: {
      es: 'Alto volumen de planes de un solo uso y pressure de compilacion.',
      en: 'High single-use plans and compile pressure.',
    },
    labHint: {
      es: 'Fuerza parametrizacion y compara usecounts antes/despues.',
      en: 'Force parameterization and compare usecounts before/after.',
    },
    script: `SELECT objtype,
  cacheobjtype,
  usecounts,
  size_in_bytes / 1024 AS size_kb
FROM sys.dm_exec_cached_plans
WHERE objtype = 'Adhoc'
ORDER BY size_in_bytes DESC;`,
  },
  {
    id: 'objcp',
    name: 'CACHESTORE_OBJCP',
    share: 8,
    accent: 'blue',
    title: { es: 'Plan Cache de objetos', en: 'Object plan cache' },
    summary: {
      es: 'Procedimientos, triggers y funciones compiladas listas para reutilizarse.',
      en: 'Compiled procedures, triggers and functions ready for reuse.',
    },
    signal: {
      es: 'Si cae usecounts de forma abrupta, puede haber recompilaciones globales.',
      en: 'If usecounts drops sharply, global recompilation may be happening.',
    },
    labHint: {
      es: 'Mide compilaciones/sec y eventos de recompile en paralelo.',
      en: 'Track compilations/sec and recompile events in parallel.',
    },
    script: `SELECT cp.objtype,
  cp.usecounts,
  DB_NAME(st.dbid) AS db_name,
  OBJECT_NAME(st.objectid, st.dbid) AS object_name
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle) st
WHERE cp.objtype IN ('Proc', 'Prepared')
ORDER BY cp.usecounts DESC;`,
  },
  {
    id: 'logpool',
    name: 'MEMORYCLERK_SQLLOGPOOL',
    share: 5,
    accent: 'rose',
    title: { es: 'Log pool', en: 'Log pool' },
    summary: {
      es: 'Buffers del WAL antes de vaciar el log al LDF. Se dispara con commits pequenos y WRITELOG.',
      en: 'WAL buffers before flushing the log to the LDF. Spikes with small commits and WRITELOG waits.',
    },
    signal: {
      es: 'WRITELOG alto con transacciones pequenas suele inflarlo.',
      en: 'High WRITELOG with tiny transactions usually inflates it.',
    },
    labHint: {
      es: 'Agrupa commits y compara Log Flushes/sec contra latencia de commit.',
      en: 'Batch commits and compare Log Flushes/sec against commit latency.',
    },
    script: `SELECT cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name = 'Log Flushes/sec';`,
  },
  {
    id: 'grants',
    name: 'MEMORYCLERK_SQLQERESERVATIONS',
    share: 6,
    accent: 'amber',
    title: { es: 'Workspace grants', en: 'Workspace grants' },
    summary: {
      es: 'Memoria temporal para sorts, hashes y operadores que no pueden ejecutarse en streaming puro.',
      en: 'Temporary memory for sorts, hashes and operators that cannot run in pure streaming mode.',
    },
    signal: {
      es: 'MemGrantsPending > 0 y spills a tempdb indican presion.',
      en: 'MemGrantsPending > 0 and tempdb spills indicate pressure.',
    },
    labHint: {
      es: 'Activa Query Store y observa si memory grant feedback estabiliza.',
      en: 'Enable Query Store and watch if memory grant feedback stabilizes.',
    },
    script: `SELECT session_id,
  requested_memory_kb,
  granted_memory_kb,
  ideal_memory_kb,
  wait_time_ms
FROM sys.dm_exec_query_memory_grants
ORDER BY requested_memory_kb DESC;`,
  },
  {
    id: 'sqLOS',
    name: 'MEMORYCLERK_SQLOS',
    share: 3,
    accent: 'violet',
    title: { es: 'Estructuras SQLOS', en: 'SQLOS structures' },
    summary: {
      es: 'Schedulers, workers y estructuras internas del host de ejecucion de SQL Server.',
      en: 'Schedulers, workers and internal structures of the SQL Server execution host.',
    },
    signal: {
      es: 'Si sube junto a worker pressure, revisa paralelismo y thread pool.',
      en: 'If it rises with worker pressure, review parallelism and thread pool.',
    },
    labHint: {
      es: 'Cruza con sys.dm_os_schedulers para ver RUNNABLE y workers activos.',
      en: 'Correlate with sys.dm_os_schedulers for RUNNABLE and active workers.',
    },
    script: `SELECT type,
  SUM(pages_kb) / 1024 AS used_mb
FROM sys.dm_os_memory_clerks
WHERE type = 'MEMORYCLERK_SQLOS'
GROUP BY type;`,
  },
  {
    id: 'temp',
    name: 'CACHESTORE_TEMPTABLES',
    share: 3,
    accent: 'amber',
    title: { es: 'Metadata TempDB', en: 'TempDB metadata' },
    summary: {
      es: 'Cache de metadatos temporales. Ayuda cuando muchas sesiones crean y destruyen objetos efimeros.',
      en: 'Temporary metadata cache. Helps when many sessions create and destroy ephemeral objects.',
    },
    signal: {
      es: 'Crecimiento rapido en cargas ETL o micro-batches con muchos objetos #temp.',
      en: 'Fast growth in ETL or micro-batch workloads with many #temp objects.',
    },
    labHint: {
      es: 'Evalua metadata memory-optimized de TempDB en 2019+.',
      en: 'Evaluate TempDB memory-optimized metadata in 2019+.',
    },
    script: `SELECT type,
  SUM(pages_kb) / 1024 AS used_mb
FROM sys.dm_os_memory_clerks
WHERE type = 'CACHESTORE_TEMPTABLES'
GROUP BY type;`,
  },
  {
    id: 'srvproc',
    name: 'MEMORYCLERK_SRVPROC',
    share: 2,
    accent: 'rose',
    title: { es: 'Conexiones y contexto', en: 'Connections and context' },
    summary: {
      es: 'Memoria por sesion, paquetes TDS y estructuras de contexto por conexion.',
      en: 'Per-session memory, TDS packets and per-connection context structures.',
    },
    signal: {
      es: 'Sube cuando hay demasiadas conexiones concurrentes sin pooling.',
      en: 'It rises with too many concurrent connections without pooling.',
    },
    labHint: {
      es: 'Compara sesiones activas vs sleeping y valida connection pooling.',
      en: 'Compare active vs sleeping sessions and validate connection pooling.',
    },
    script: `SELECT COUNT(*) AS sessions,
  SUM(memory_usage * 8) AS session_kb
FROM sys.dm_exec_sessions
WHERE is_user_process = 1;`,
  },
  {
    id: 'tokenperm',
    name: 'USERSTORE_TOKENPERM',
    share: 2,
    accent: 'violet',
    title: { es: 'Security token store', en: 'Security token store' },
    summary: {
      es: 'Cache de tokens y permisos de seguridad. Puede crecer en entornos con mucha variacion de principals.',
      en: 'Security token and permission cache. Can grow in environments with heavy principal churn.',
    },
    signal: {
      es: 'Aumenta con muchos logins cortos y cambios frecuentes de permisos.',
      en: 'Increases with many short-lived logins and frequent permission changes.',
    },
    labHint: {
      es: 'Busca login storms y consolida autenticacion/aplicaciones.',
      en: 'Look for login storms and consolidate authentication/app patterns.',
    },
    script: `SELECT type,
  SUM(pages_kb) / 1024.0 AS used_mb
FROM sys.dm_os_memory_clerks
WHERE type = 'USERSTORE_TOKENPERM'
GROUP BY type;`,
  },
  {
    id: 'xe',
    name: 'MEMORYCLERK_XE',
    share: 2,
    accent: 'cyan',
    title: { es: 'Extended Events buffers', en: 'Extended Events buffers' },
    summary: {
      es: 'Buffers de sesiones XE. Sesiones mal acotadas o targets pesados pueden crecer mucho.',
      en: 'Buffers for XE sessions. Poorly scoped sessions or heavy targets can grow fast.',
    },
    signal: {
      es: 'Si dispara CPU y memoria de captura, revisa filtros/targets de XE.',
      en: 'If capture CPU and memory jump, review XE filters/targets.',
    },
    labHint: {
      es: 'Prueba ring_buffer vs event_file y mide impacto de cada target.',
      en: 'Test ring_buffer vs event_file and measure each target impact.',
    },
    script: `SELECT type,
  SUM(pages_kb) / 1024.0 AS used_mb
FROM sys.dm_os_memory_clerks
WHERE type = 'MEMORYCLERK_XE'
GROUP BY type;`,
  },
  {
    id: 'xtp',
    name: 'MEMORYCLERK_XTP',
    share: 2,
    accent: 'emerald',
    title: { es: 'In-Memory OLTP', en: 'In-Memory OLTP' },
    summary: {
      es: 'Memoria para tablas memory-optimized y sus estructuras. Tiene reglas de capacidad distintas.',
      en: 'Memory for memory-optimized tables and related structures. Capacity rules differ from buffer pool.',
    },
    signal: {
      es: 'Sube de forma sostenida; no se comporta como cache tradicional.',
      en: 'Rises steadily; it does not behave like a classic cache.',
    },
    labHint: {
      es: 'Valida limites de memoria por edition y crecimiento de checkpoint files.',
      en: 'Validate edition memory limits and checkpoint file growth.',
    },
    script: `SELECT type,
  SUM(pages_kb) / 1024.0 AS used_mb
FROM sys.dm_os_memory_clerks
WHERE type LIKE 'MEMORYCLERK_XTP%'
GROUP BY type
ORDER BY used_mb DESC;`,
  },
  {
    id: 'columnstore',
    name: 'CACHESTORE_COLUMNSTOREOBJECTPOOL',
    share: 2,
    accent: 'blue',
    title: { es: 'Columnstore object pool', en: 'Columnstore object pool' },
    summary: {
      es: 'Segmentos y metadatos reutilizados por workloads analiticos con columnstore.',
      en: 'Reusable segments and metadata for columnstore analytic workloads.',
    },
    signal: {
      es: 'Crece en scans analiticos repetitivos de tablas columnstore.',
      en: 'Grows with repeated analytic scans over columnstore tables.',
    },
    labHint: {
      es: 'Cruza con batch mode, memory grants y tempdb spills.',
      en: 'Correlate with batch mode, memory grants, and tempdb spills.',
    },
    script: `SELECT type,
  SUM(pages_kb) / 1024.0 AS used_mb
FROM sys.dm_os_memory_clerks
WHERE type LIKE 'CACHESTORE_COLUMNSTORE%'
GROUP BY type;`,
  },
];

const CLERK_LABS: ClerkLab[] = [
  {
    id: 'plan-churn',
    title: { es: 'Churn de planes ad-hoc', en: 'Ad-hoc plan churn' },
    objective: {
      es: 'Detectar cuando SQLCP desplaza memoria util por planes de un solo uso.',
      en: 'Detect when SQLCP displaces useful memory due to single-use plans.',
    },
    steps: [
      { es: '1) Ejecuta carga ad-hoc sin parametrizacion durante 5-10 min.', en: '1) Run ad-hoc non-parameterized workload for 5-10 min.' },
      { es: '2) Captura usecounts, compilaciones/sec y tamano de SQLCP.', en: '2) Capture usecounts, compilations/sec, and SQLCP size.' },
      { es: '3) Repite con parametrizacion forzada y compara.', en: '3) Repeat with forced parameterization and compare.' },
    ],
    focusClerkId: 'sqlcp',
    diagnosticScript: `SELECT TOP 25
  cp.usecounts,
  cp.size_in_bytes / 1024 AS size_kb,
  st.text
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle) st
WHERE cp.objtype = 'Adhoc'
ORDER BY cp.size_in_bytes DESC;`,
    remediationScript: `ALTER DATABASE CURRENT SET PARAMETERIZATION FORCED;
-- Optionally pair with Query Store plan controls for outliers`,
  },
  {
    id: 'grant-pressure',
    title: { es: 'Presion de memory grants', en: 'Memory grant pressure' },
    objective: {
      es: 'Mostrar cola de memory grants y como impacta en latencia.',
      en: 'Show memory grant queueing and its latency impact.',
    },
    steps: [
      { es: '1) Lanza queries con hashes/sorts grandes en paralelo.', en: '1) Launch parallel hash/sort-heavy queries.' },
      { es: '2) Observa MemGrantsPending y wait_time_ms en grants.', en: '2) Observe MemGrantsPending and wait_time_ms in grants.' },
      { es: '3) Ajusta cardinalidad/indices y repite para validar mejora.', en: '3) Tune cardinality/indexing and rerun to validate gains.' },
    ],
    focusClerkId: 'grants',
    diagnosticScript: `SELECT session_id,
  requested_memory_kb,
  granted_memory_kb,
  ideal_memory_kb,
  wait_time_ms
FROM sys.dm_exec_query_memory_grants
ORDER BY wait_time_ms DESC;`,
    remediationScript: `-- Focus on row estimation quality first:
-- 1) Update stats with FULLSCAN on critical tables
-- 2) Add missing covering indexes for large sorts/hashes
-- 3) Review memory grant feedback in Query Store`,
  },
  {
    id: 'xe-overhead',
    title: { es: 'XE con overhead de memoria', en: 'XE memory overhead' },
    objective: {
      es: 'Comparar sesiones XE eficientes vs sesiones sin filtros.',
      en: 'Compare efficient XE sessions vs noisy unfiltered sessions.',
    },
    steps: [
      { es: '1) Arranca una sesion XE sin filtros y mide MEMORYCLERK_XE.', en: '1) Start an unfiltered XE session and measure MEMORYCLERK_XE.' },
      { es: '2) Cambia a filtros por DB/SPID y event_file.', en: '2) Switch to DB/SPID filters and event_file target.' },
      { es: '3) Verifica reduccion de memoria y menor ruido operativo.', en: '3) Verify lower memory use and reduced operational noise.' },
    ],
    focusClerkId: 'xe',
    diagnosticScript: `SELECT type,
  SUM(pages_kb) / 1024.0 AS used_mb
FROM sys.dm_os_memory_clerks
WHERE type = 'MEMORYCLERK_XE'
GROUP BY type;`,
    remediationScript: `-- Keep XE focused:
-- 1) Filter by database_id, session_id or wait_type
-- 2) Prefer event_file over ring_buffer for long captures
-- 3) Stop sessions after the incident window`,
  },
];

const MEMORY_PRESETS: MemoryPreset[] = [
  {
    id: 'balanced',
    label: { es: 'Balanceado', en: 'Balanced' },
    desc: { es: 'Mantiene margen OS y evita starvation', en: 'Keeps OS headroom and avoids starvation' },
    min: 2048,
    max: 12288,
  },
  {
    id: 'etl-window',
    label: { es: 'Ventana ETL', en: 'ETL window' },
    desc: { es: 'Mas cache SQL para cargas por lotes', en: 'More SQL cache for batch processing windows' },
    min: 4096,
    max: 13312,
  },
  {
    id: 'multi-instance',
    label: { es: 'Multi-instancia', en: 'Multi-instance' },
    desc: { es: 'Reserva RAM para otras instancias/servicios', en: 'Reserves RAM for other instances/services' },
    min: 2048,
    max: 10240,
  },
];

export function MemoryOperations() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bufferpool' | 'clerks' | 'memory-config'>('bufferpool');
  const [selectedClerkId, setSelectedClerkId] = useState<MemoryClerkDef['id']>('bufferpool');
  const [selectedClerkLabId, setSelectedClerkLabId] = useState<ClerkLab['id']>('plan-churn');

  // Buffer Pool State
  const [bufferPool, setBufferPool] = useState<Page[]>(
    Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      state: 'free',
      data: '',
    }))
  );
  const [logs, setLogs] = useState<string[]>(['SQLOS Memory Manager Initialized.']);

  // Memory Configuration State
  const [minMemory, setMinMemory] = useState(2048);
  const [maxMemory, setMaxMemory] = useState(8192);
  const systemMemory = 16384; // 16GB Total

  const [isTsqlOpen, setIsTsqlOpen] = useState(false);
  const selectedClerk = MEMORY_CLERKS.find((clerk) => clerk.id === selectedClerkId) ?? MEMORY_CLERKS[0];
  const selectedLab = CLERK_LABS.find((lab) => lab.id === selectedClerkLabId) ?? CLERK_LABS[0];
  const osHeadroom = systemMemory - maxMemory;
  const dynamicSqlRange = maxMemory - minMemory;
  const memoryRisk = useMemo(() => {
    if (osHeadroom < 3072) {
      return 'critical';
    }
    if (osHeadroom < 4096 || dynamicSqlRange < 2048) {
      return 'warning';
    }
    return 'healthy';
  }, [dynamicSqlRange, osHeadroom]);
  const accentMap: Record<ClerkAccent, string> = {
    emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    blue: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    rose: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    amber: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    violet: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  };

  const applyPreset = (preset: MemoryPreset) => {
    const cappedMin = Math.min(Math.max(512, preset.min), systemMemory - 512);
    const cappedMax = Math.min(Math.max(cappedMin + 512, preset.max), systemMemory);
    setMinMemory(cappedMin);
    setMaxMemory(cappedMax);
  };

  const memoryConfigScript = `EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'min server memory (MB)', ${minMemory};
EXEC sp_configure 'max server memory (MB)', ${maxMemory};
RECONFIGURE;

SELECT name, value_in_use
FROM sys.configurations
WHERE name IN ('min server memory (MB)', 'max server memory (MB)');`;

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 5));
    };

    const simulateRead = () => {
        const freeIndex = bufferPool.findIndex(p => p.state === 'free');
        if (freeIndex !== -1) {
            const newPool = [...bufferPool];
            newPool[freeIndex] = { id: freeIndex, state: 'clean', data: 'Table_Data_Page_1' };
            setBufferPool(newPool);
            addLog(`Logical Read -> Physical Read: Loaded page into Buffer Pool [Slot ${freeIndex}]`);
        } else {
            addLog('Buffer Pool full! Need to run Lazy Writer to free space.');
        }
    };

    const simulateUpdate = () => {
        const cleanIndex = bufferPool.findIndex(p => p.state === 'clean');
        if (cleanIndex !== -1) {
            const newPool = [...bufferPool];
            newPool[cleanIndex] = { ...newPool[cleanIndex], state: 'dirty', data: 'Table_Data_Page_1_UPDATED' };
            setBufferPool(newPool);
            addLog(`Logical write -> Write-Ahead Log: Modified page [Slot ${cleanIndex}]. Page is now DIRTY.`);
        } else {
            addLog('No clean pages to update in memory. Perform a read first.');
        }
    };

    const simulateCheckpoint = () => {
        const newPool = bufferPool.map(p =>
            p.state === 'dirty' ? { ...p, state: 'clean' as const } : p
        );
        const dirtyCount = bufferPool.filter(p => p.state === 'dirty').length;

        if (dirtyCount > 0) {
            setBufferPool(newPool);
            addLog(`CHECKPOINT: Flushed ${dirtyCount} dirty pages to disk. Marked as clean.`);
        } else {
            addLog('CHECKPOINT: No dirty pages to flush.');
        }
    };

    const simulateLazyWriter = () => {
        const targetPages = bufferPool.filter(p => p.state !== 'free').slice(0, 3); // Emulate sweeping 3 random pages
        let freedCount = 0;

        if (targetPages.length > 0) {
            const newPool = bufferPool.map(p => {
                if (targetPages.find(tp => tp.id === p.id)) {
                    freedCount++;
                    return { ...p, state: 'free' as const, data: '' };
                }
                return p;
            });
            setBufferPool(newPool);
            addLog(`LAZY WRITER: Evicted ${freedCount} aged clean/dirty pages to free list.`);
        } else {
            addLog('LAZY WRITER: Buffer pool is already empty.');
        }
    };

    return (
        <div className="flex min-h-full flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            {t('memTitle')}
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            {t('memDescription')}
                        </p>
                    </div>
                </div>

                <div className="glass-panel flex w-full flex-wrap rounded-xl border border-white/10 bg-white/5 p-1 sm:w-fit">
                    <button
                        onClick={() => setActiveTab('bufferpool')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'bufferpool' ? "bg-purple-500 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Cpu className="w-4 h-4" />
                        Buffer Pool
                    </button>
                    <button
                        onClick={() => setActiveTab('clerks')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'clerks' ? "bg-pink-500 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <PieChart className="w-4 h-4" />
                        {language === 'es' ? 'Clerks de Memoria' : 'Memory Clerks'}
                    </button>
                    <button
                        onClick={() => setActiveTab('memory-config')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'memory-config' ? "bg-indigo-500 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Sliders className="w-4 h-4" />
                        {language === 'es' ? 'Max/Min Memoria' : 'Max/Min Memory'}
                    </button>
                </div>
            </div>

            <div className="relative min-h-0 flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'bufferpool' && (
                        <motion.div
                            key="bufferpool"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="min-h-full flex flex-col gap-6 overflow-y-auto pb-4"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                                {/* Memory Map Diagram */}
                                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

                                    <div className="flex justify-between items-center mb-6 z-10 flex-wrap gap-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Cpu className="w-5 h-5 text-purple-400" /> {t('sysRamArch')}
                                            <button
                                                onClick={() => setIsTsqlOpen(true)}
                                                className="ml-4 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
                                            >
                                                <Code2 className="w-3.5 h-3.5" /> {t('viewTsql')}
                                            </button>
                                        </h3>
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            <button onClick={simulateRead} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded flex items-center gap-2 text-sm text-blue-300 transition-colors">
                                                <HardDrive className="w-4 h-4" /> {t('simRead')}
                                            </button>
                                            <button onClick={simulateUpdate} className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded flex items-center gap-2 text-sm text-amber-300 transition-colors">
                                                <Zap className="w-4 h-4" /> {t('simUpdate')}
                                            </button>
                                            <button onClick={simulateCheckpoint} className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded flex items-center gap-2 text-sm text-emerald-300 transition-colors">
                                                <Archive className="w-4 h-4" /> {t('simCheckpoint')}
                                            </button>
                                            <button onClick={simulateLazyWriter} className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded flex items-center gap-2 text-sm text-purple-300 transition-colors">
                                                <SearchCode className="w-4 h-4" /> {t('simLazyWriter')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Buffer Pool visualization */}
                                    <div className="flex flex-col gap-6 z-10 flex-1">
                                        <div className="border border-purple-500/30 rounded-xl bg-black/40 p-4 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-4 border-b border-purple-500/20 pb-2 flex-wrap gap-2">
                                                <h4 className="font-bold text-purple-400 tracking-wider w-full md:w-auto">{t('bufferPoolTitle')}</h4>
                                                <div className="flex gap-4 text-xs">
                                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-white/10" /> {t('memFree')}</span>
                                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> {t('memClean')}</span>
                                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.5)]" /> {t('memDirty')}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 flex-1 content-start">
                                                <AnimatePresence>
                                                    {bufferPool.map((page) => (
                                                        <motion.div
                                                            key={page.id}
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className={cn(
                                                                "aspect-square rounded flex items-center justify-center text-xs font-mono border transition-all duration-300",
                                                                page.state === 'free' && "border-white/10 bg-white/5",
                                                                page.state === 'clean' && "border-blue-500/50 bg-blue-500/20 shadow-glowBlue",
                                                                page.state === 'dirty' && "border-amber-500/50 bg-amber-500/20 shadow-glow"
                                                            )}
                                                        >
                                                            {page.state !== 'free' ? '8KB' : ''}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {/* Other Memory Clerks Overview */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="border border-cyan-500/30 rounded-xl bg-black/40 p-4">
                                                <h4 className="font-bold text-cyan-400 text-sm mb-2">{t('planCacheTitle')}</h4>
                                                <p className="text-xs text-muted-foreground">{t('planCacheDesc')}</p>
                                                <div className="mt-3 h-2 bg-white/10 rounded overflow-hidden relative">
                                                    <motion.div
                                                        initial={{ width: '30%' }}
                                                        animate={{ width: logs.length > 2 ? '80%' : '30%' }}
                                                        className="h-full bg-cyan-500/50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="border border-pink-500/30 rounded-xl bg-black/40 p-4">
                                                <h4 className="font-bold text-pink-400 text-sm mb-2">{t('logBufferTitle')}</h4>
                                                <p className="text-xs text-muted-foreground">{t('logBufferDesc')}</p>
                                                <div className="mt-3 h-2 bg-white/10 rounded overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: '10%' }}
                                                        animate={{ width: bufferPool.filter(p => p.state === 'dirty').length * 10 + '%' }}
                                                        className="h-full bg-pink-500/50 shadow-glow"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Log and Explanations */}
                                <div className="flex flex-col gap-6 flex-1">
                                    <div className="glass-panel p-6 rounded-2xl border-white/10 flex-1">
                                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                            <LayoutDashboard className="w-5 h-5" /> {t('activityLog')}
                                        </h3>
                                        <div className="space-y-3 font-mono text-xs">
                                            <AnimatePresence>
                                                {logs.map((log, i) => (
                                                    <motion.div
                                                        key={i + log}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className={cn(
                                                            "p-3 rounded border",
                                                            i === 0 ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-muted-foreground"
                                                        )}
                                                    >
                                                        <span className="opacity-50 mr-2">{'>'}</span>{log}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="glass-panel p-6 rounded-2xl border-white/10 text-sm">
                                        <h3 className="font-bold mb-3 text-purple-400">{t('keyConcepts')}</h3>
                                        <ul className="space-y-3 text-muted-foreground">
                                            <li>
                                                <strong className="text-white">{t('conceptLogicalReadTitle')}</strong> {t('conceptLogicalReadDesc')}
                                            </li>
                                            <li>
                                                <strong className="text-white">{t('conceptPhysicalReadTitle')}</strong> {t('conceptPhysicalReadDesc')}
                                            </li>
                                            <li>
                                                <strong className="text-white">{t('conceptWalTitle')}</strong> {t('conceptWalDesc')}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'clerks' && (
                        <motion.div
                            key="clerks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid min-h-full w-full grid-cols-1 gap-6 overflow-y-auto pb-4 xl:grid-cols-[minmax(0,1.1fr)_420px]"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-purple-500/20">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                                                <PieChart className="w-5 h-5" /> {t('memClerksTitle')}
                                            </h3>
                                            <p className="text-muted-foreground text-sm mt-2">{t('memClerksDesc')}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsTsqlOpen(true)}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
                                        >
                                            <Code2 className="w-3.5 h-3.5" /> {t('viewTsql')}
                                        </button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {MEMORY_CLERKS.map((clerk) => {
                                            const isActive = clerk.id === selectedClerk.id;

                                            return (
                                                <button
                                                    key={clerk.id}
                                                    onClick={() => setSelectedClerkId(clerk.id)}
                                                    className={cn(
                                                        'rounded-2xl border p-4 text-left transition-all',
                                                        isActive
                                                            ? `${accentMap[clerk.accent]} shadow-[0_0_22px_rgba(255,255,255,0.06)]`
                                                            : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-white">
                                                                {language === 'es' ? clerk.title.es : clerk.title.en}
                                                            </div>
                                                            <div className="mt-1 text-[11px] font-mono text-white/40 break-all">
                                                                {clerk.name}
                                                            </div>
                                                        </div>
                                                        <div className={cn('rounded-full px-2 py-1 text-xs font-black border', accentMap[clerk.accent])}>
                                                            {clerk.share}%
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-sm leading-relaxed text-white/65">
                                                        {language === 'es' ? clerk.summary.es : clerk.summary.en}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div>
                                            <h4 className="text-lg font-bold text-white">
                                                {language === 'es' ? 'Detalle del clerk seleccionado' : 'Selected clerk detail'}
                                            </h4>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {language === 'es' ? selectedClerk.summary.es : selectedClerk.summary.en}
                                            </p>
                                        </div>
                                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60">
                                            {language === 'es' ? 'Participacion estimada' : 'Estimated share'}: {selectedClerk.share}%
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3">
                                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-white/70">
                                            <div className="font-bold uppercase tracking-[0.18em] text-white/45">
                                                {language === 'es' ? 'Senal operativa' : 'Operational signal'}
                                            </div>
                                            <p className="mt-2">{language === 'es' ? selectedClerk.signal.es : selectedClerk.signal.en}</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-white/70">
                                            <div className="font-bold uppercase tracking-[0.18em] text-white/45">
                                                {language === 'es' ? 'Pista operativa' : 'Operational hint'}
                                            </div>
                                            <p className="mt-2">{language === 'es' ? selectedClerk.labHint.es : selectedClerk.labHint.en}</p>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <CopyCodeBlock code={selectedClerk.script} accent={selectedClerk.accent} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h4 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                                            <FlaskConical className="w-5 h-5" />
                                            {language === 'es' ? 'Escenarios de memory clerks' : 'Memory clerk scenarios'}
                                        </h4>
                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/65">
                                            {language === 'es' ? 'Incluye scripts' : 'Includes scripts'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-white/65 mt-2">
                                        {language === 'es'
                                            ? 'Cada escenario trae diagnostico y una accion de remediacion para validar mejoras.'
                                            : 'Each scenario includes diagnostics and a remediation action to validate improvements.'}
                                    </p>

                                    <div className="mt-4 grid gap-2">
                                        {CLERK_LABS.map((lab) => (
                                            <button
                                                key={lab.id}
                                                onClick={() => {
                                                    setSelectedClerkLabId(lab.id);
                                                    setSelectedClerkId(lab.focusClerkId);
                                                }}
                                                className={cn(
                                                    'rounded-xl border px-3 py-2 text-left text-sm transition-all',
                                                    lab.id === selectedLab.id
                                                        ? 'border-cyan-500/35 bg-cyan-500/10 text-cyan-100'
                                                        : 'border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/[0.06]'
                                                )}
                                            >
                                                {language === 'es' ? lab.title.es : lab.title.en}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                                        <div className="text-sm font-bold text-white">{language === 'es' ? selectedLab.title.es : selectedLab.title.en}</div>
                                        <p className="mt-2 text-sm text-white/70">{language === 'es' ? selectedLab.objective.es : selectedLab.objective.en}</p>
                                        <div className="mt-3 space-y-2 text-xs text-white/65">
                                            {(language === 'es' ? selectedLab.steps.map((s) => s.es) : selectedLab.steps.map((s) => s.en)).map((step, idx) => (
                                                <p key={`${selectedLab.id}-step-${idx}`}>{step}</p>
                                            ))}
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            <CopyCodeBlock code={selectedLab.diagnosticScript} accent="cyan" />
                                            <CopyCodeBlock code={selectedLab.remediationScript} accent="emerald" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'memory-config' && (
                        <motion.div
                            key="memory-config"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid min-h-full w-full grid-cols-1 gap-6 overflow-y-auto pb-4 xl:grid-cols-[minmax(0,1.1fr)_420px]"
                        >
                            <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-pink-500/20">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-pink-400">
                                    <Sliders className="w-5 h-5" /> {t('minMaxMemoryTitle')}
                                </h3>
                                <p className="text-muted-foreground text-sm">{t('minMaxMemoryDesc')}</p>

                                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                    {MEMORY_PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            className="rounded-xl border border-white/10 bg-black/25 p-3 text-left transition-all hover:border-white/25 hover:bg-white/[0.06]"
                                        >
                                            <div className="text-sm font-bold text-white">{language === 'es' ? preset.label.es : preset.label.en}</div>
                                            <div className="mt-1 text-xs text-white/60">{language === 'es' ? preset.desc.es : preset.desc.en}</div>
                                            <div className="mt-2 text-[11px] font-mono text-white/40">
                                                min {preset.min} MB | max {preset.max} MB
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-6 mt-3">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-bold">{t('minMemoryLabel')}</label>
                                            <span className="font-mono text-pink-400">{minMemory} MB</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={maxMemory}
                                            step="512"
                                            value={minMemory}
                                            onChange={(e) => setMinMemory(Number(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-bold">{t('maxMemoryLabel')}</label>
                                            <span className="font-mono text-purple-400">{maxMemory} MB</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={minMemory}
                                            max={systemMemory}
                                            step="512"
                                            value={maxMemory}
                                            onChange={(e) => setMaxMemory(Number(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                        <h4 className="text-sm font-bold text-center mb-4">
                                            {language === 'es' ? 'Asignacion total del host (16 GB)' : 'Total host allocation (16 GB)'}
                                        </h4>
                                        <div className="h-12 flex rounded-xl overflow-hidden border border-white/20">
                                            <div
                                                className="bg-emerald-500 flex items-center justify-center text-xs font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300"
                                                style={{ width: `${(minMemory / systemMemory) * 100}%` }}
                                            >
                                                {minMemory > 2000 && 'Min SQL'}
                                            </div>
                                            <div
                                                className="bg-purple-500/50 flex items-center justify-center text-xs font-bold text-white border-x border-white/20 whitespace-nowrap overflow-hidden relative transition-all duration-300"
                                                style={{ width: `${(dynamicSqlRange / systemMemory) * 100}%` }}
                                            >
                                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-50" />
                                                {dynamicSqlRange > 2000 && 'Dynamic SQL'}
                                            </div>
                                            <div
                                                className="bg-gray-500 flex items-center justify-center text-xs font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300"
                                                style={{ width: `${(osHeadroom / systemMemory) * 100}%` }}
                                            >
                                                {osHeadroom > 2000 && 'OS'}
                                            </div>
                                        </div>
                                        <p className="text-xs text-center text-muted-foreground mt-2 mb-4">OS Memory: {osHeadroom} MB</p>
                                        <div
                                            className={cn(
                                                'p-3 rounded-lg text-xs text-left flex items-start gap-3 leading-relaxed mt-2 border',
                                                memoryRisk === 'healthy' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
                                                memoryRisk === 'warning' && 'bg-amber-500/10 border-amber-500/30 text-amber-200',
                                                memoryRisk === 'critical' && 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                            )}
                                        >
                                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                            <span>
                                                {memoryRisk === 'healthy' &&
                                                    (language === 'es'
                                                        ? 'Configuracion sana: hay margen para SO y rango dinamico en SQL.'
                                                        : 'Healthy setup: enough OS headroom and SQL dynamic range.')}
                                                {memoryRisk === 'warning' &&
                                                    (language === 'es'
                                                        ? 'Riesgo medio: revisa separacion entre min/max y memoria libre del SO.'
                                                        : 'Medium risk: review min/max separation and OS free memory.')}
                                                {memoryRisk === 'critical' &&
                                                    (language === 'es'
                                                        ? 'Riesgo alto: el SO puede paginar y golpear latencia global.'
                                                        : 'High risk: OS paging can hurt global latency.')}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                                            {language === 'es' ? 'Comando listo para copiar y pegar' : 'Ready-to-paste command'}
                                        </p>
                                        <CopyCodeBlock code={memoryConfigScript} accent="violet" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20">
                                    <h4 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                                        <Gauge className="w-5 h-5" />
                                        {language === 'es' ? 'Checks de validacion' : 'Validation checks'}
                                    </h4>
                                    <p className="text-sm text-white/65 mt-2">
                                        {language === 'es'
                                            ? 'Min no reserva RAM al iniciar; es suelo despues de crecer. Max controla objetivo del motor, no todo el proceso.'
                                            : 'Min does not reserve RAM at startup; it is a floor after growth. Max controls engine target, not every process byte.'}
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <CopyCodeBlock code={`SELECT physical_memory_kb / 1024 AS physical_mb,
       available_physical_memory_kb / 1024 AS available_mb,
       system_memory_state_desc
FROM sys.dm_os_sys_memory;`} accent="cyan" />
                                        <CopyCodeBlock code={`SELECT process_physical_memory_low,
       process_virtual_memory_low,
       physical_memory_in_use_kb / 1024 AS in_use_mb
FROM sys.dm_os_process_memory;`} accent="amber" />
                                        <CopyCodeBlock code={`SELECT name, cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name IN ('Page life expectancy', 'Memory Grants Pending', 'Free list stalls/sec');`} accent="emerald" />
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Server className="w-5 h-5 text-violet-300" />
                                        {language === 'es' ? 'Ajuste operativo' : 'Operational tuning'}
                                    </h4>
                                    <div className="mt-3 space-y-2 text-sm text-white/70">
                                        <p>{language === 'es' ? '1) Toma baseline de PLE, Memory Grants Pending y waits de I/O.' : '1) Capture baseline PLE, Memory Grants Pending, and I/O waits.'}</p>
                                        <p>{language === 'es' ? '2) Ajusta max en tramos de 512-1024 MB y espera un ciclo completo.' : '2) Adjust max in 512-1024 MB steps and wait a full cycle.'}</p>
                                        <p>{language === 'es' ? '3) Conserva el punto con menos paging de SO y mejor estabilidad.' : '3) Keep the point with lower OS paging and better stability.'}</p>
                                    </div>
                                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs text-left flex items-start gap-3 leading-relaxed">
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <span>{t('osMemoryWarning')}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <TSqlModal
                isOpen={isTsqlOpen}
                onClose={() => setIsTsqlOpen(false)}
                title={t('memTsqlTitle')}
                description={t('memTsqlDesc')}
                diagnosticScript={{
                    '2019': `-- Top Memory Clerks by usage\nSELECT TOP 15\n  type AS clerk_type,\n  name AS clerk_name,\n  SUM(pages_kb) / 1024 AS used_mb,\n  SUM(virtual_memory_committed_kb) / 1024 AS vm_mb,\n  SUM(awe_allocated_kb) / 1024 AS awe_mb,\n  COUNT(*) AS numa_nodes\nFROM sys.dm_os_memory_clerks\nGROUP BY type, name\nORDER BY used_mb DESC;\n\n-- Total memory by clerk category\nSELECT type,\n  SUM(pages_kb) / 1024 AS total_mb,\n  ROUND(SUM(pages_kb) * 100.0 / SUM(SUM(pages_kb)) OVER(), 1) AS pct\nFROM sys.dm_os_memory_clerks\nGROUP BY type\nORDER BY total_mb DESC;`,
                    '2022': `-- Top Memory Clerks by usage\nSELECT TOP 15\n  type AS clerk_type,\n  name AS clerk_name,\n  SUM(pages_kb) / 1024 AS used_mb,\n  SUM(virtual_memory_committed_kb) / 1024 AS vm_mb,\n  SUM(awe_allocated_kb) / 1024 AS awe_mb,\n  COUNT(*) AS numa_nodes\nFROM sys.dm_os_memory_clerks\nGROUP BY type, name\nORDER BY used_mb DESC;\n\n-- Total memory by clerk category\nSELECT type,\n  SUM(pages_kb) / 1024 AS total_mb,\n  ROUND(SUM(pages_kb) * 100.0 / SUM(SUM(pages_kb)) OVER(), 1) AS pct\nFROM sys.dm_os_memory_clerks\nGROUP BY type\nORDER BY total_mb DESC;`,
                    '2025': `-- Top Memory Clerks by usage\nSELECT TOP 15\n  type AS clerk_type,\n  name AS clerk_name,\n  SUM(pages_kb) / 1024 AS used_mb,\n  SUM(virtual_memory_committed_kb) / 1024 AS vm_mb,\n  SUM(awe_allocated_kb) / 1024 AS awe_mb,\n  COUNT(*) AS numa_nodes\nFROM sys.dm_os_memory_clerks\nGROUP BY type, name\nORDER BY used_mb DESC;\n\n-- Total memory by clerk category\nSELECT type,\n  SUM(pages_kb) / 1024 AS total_mb,\n  ROUND(SUM(pages_kb) * 100.0 / SUM(SUM(pages_kb)) OVER(), 1) AS pct\nFROM sys.dm_os_memory_clerks\nGROUP BY type\nORDER BY total_mb DESC;`,
                }}
                remediationTitle={t('memRemediationTitle')}
                remediationScript={{
                    '2019': `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192;\nRECONFIGURE;`,
                    '2022': `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192;\nRECONFIGURE;`,
                    '2025': `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192;\nRECONFIGURE;`,
                }}
            />
        </div>
    );
}
