import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Zap, Cpu, Archive, LayoutDashboard, SearchCode, Code2, Sliders, PieChart, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

interface Page {
    id: number;
    state: 'clean' | 'dirty' | 'free';
    data: string;
}

const MEMORY_CLERKS = [
    {
        id: 'bufferpool',
        name: 'MEMORYCLERK_SQLBUFFERPOOL',
        share: 68,
        accent: 'emerald' as const,
        title: { es: 'Buffer Pool', en: 'Buffer Pool' },
        summary: {
            es: 'Paginas de datos e indices mantenidas en RAM para evitar I/O fisico.',
            en: 'Data and index pages kept in RAM to avoid physical I/O.',
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
        share: 12,
        accent: 'cyan' as const,
        title: { es: 'Plan Cache ad-hoc', en: 'Ad-hoc plan cache' },
        summary: {
            es: 'Planes compilados de consultas individuales. Si crece demasiado, suele oler a mala parametrizacion.',
            en: 'Compiled plans for individual queries. If it grows too much, it usually means poor parameterization.',
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
        share: 7,
        accent: 'blue' as const,
        title: { es: 'Plan Cache de objetos', en: 'Object plan cache' },
        summary: {
            es: 'Procedimientos, triggers y funciones compiladas listas para reutilizarse.',
            en: 'Compiled procedures, triggers and functions ready for reuse.',
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
        accent: 'rose' as const,
        title: { es: 'Log pool', en: 'Log pool' },
        summary: {
            es: 'Buffers del WAL antes de vaciar el log al LDF. Se dispara con commits pequenos y WRITELOG.',
            en: 'WAL buffers before flushing the log to the LDF. Spikes with small commits and WRITELOG waits.',
        },
        script: `SELECT cntr_value
FROM sys.dm_os_performance_counters
WHERE counter_name = 'Log Flushes/sec';`,
    },
    {
        id: 'grants',
        name: 'MEMORYCLERK_SQLQERESERVATIONS',
        share: 4,
        accent: 'amber' as const,
        title: { es: 'Workspace grants', en: 'Workspace grants' },
        summary: {
            es: 'Memoria temporal para sorts, hashes y operadores que no pueden ejecutarse en streaming puro.',
            en: 'Temporary memory for sorts, hashes and operators that cannot run in pure streaming mode.',
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
        share: 2,
        accent: 'violet' as const,
        title: { es: 'Estructuras SQLOS', en: 'SQLOS structures' },
        summary: {
            es: 'Schedulers, workers y estructuras internas del host de ejecucion de SQL Server.',
            en: 'Schedulers, workers and internal structures of the SQL Server execution host.',
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
        share: 1,
        accent: 'amber' as const,
        title: { es: 'Metadata TempDB', en: 'TempDB metadata' },
        summary: {
            es: 'Cache de metadatos temporales. Ayuda cuando muchas sesiones crean y destruyen objetos efimeros.',
            en: 'Temporary metadata cache. Helps when many sessions create and destroy ephemeral objects.',
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
        share: 1,
        accent: 'rose' as const,
        title: { es: 'Conexiones y contexto', en: 'Connections and context' },
        summary: {
            es: 'Memoria por sesion, paquetes TDS y estructuras de contexto por conexion.',
            en: 'Per-session memory, TDS packets and per-connection context structures.',
        },
        script: `SELECT COUNT(*) AS sessions,
  SUM(memory_usage * 8) AS session_kb
FROM sys.dm_exec_sessions
WHERE is_user_process = 1;`,
    },
] as const;

export function MemoryOperations() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'bufferpool' | 'advanced'>('bufferpool');
    const [selectedClerkId, setSelectedClerkId] = useState<(typeof MEMORY_CLERKS)[number]['id']>('bufferpool');

    // Buffer Pool State
    const [bufferPool, setBufferPool] = useState<Page[]>(
        Array.from({ length: 16 }).map((_, i) => ({
            id: i,
            state: 'free',
            data: ''
        }))
    );
    const [logs, setLogs] = useState<string[]>(['SQLOS Memory Manager Initialized.']);

    // Advanced Memory State
    const [minMemory, setMinMemory] = useState(2048);
    const [maxMemory, setMaxMemory] = useState(8192);
    const systemMemory = 16384; // 16GB Total

    const [isTsqlOpen, setIsTsqlOpen] = useState(false);
    const [tsqlType, setTsqlType] = useState<'clerks'>('clerks');
    const selectedClerk = MEMORY_CLERKS.find((clerk) => clerk.id === selectedClerkId) ?? MEMORY_CLERKS[0];
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
        <div className="flex flex-col h-full gap-6">
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

                <div className="flex p-1 bg-white/5 rounded-xl w-fit glass-panel border border-white/10">
                    <button
                        onClick={() => setActiveTab('bufferpool')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'bufferpool' ? "bg-purple-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Cpu className="w-4 h-4" />
                        Buffer Pool
                    </button>
                    <button
                        onClick={() => setActiveTab('advanced')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'advanced' ? "bg-pink-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Sliders className="w-4 h-4" />
                        Advanced (Clerks & LPIM)
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'bufferpool' && (
                        <motion.div
                            key="bufferpool"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full flex flex-col gap-6 overflow-y-auto pb-4"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                                {/* Memory Map Diagram */}
                                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

                                    <div className="flex justify-between items-center mb-6 z-10 flex-wrap gap-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Cpu className="w-5 h-5 text-purple-400" /> {t('sysRamArch')}
                                            <button
                                                onClick={() => { setTsqlType('clerks'); setIsTsqlOpen(true); }}
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

                    {activeTab === 'advanced' && (
                        <motion.div
                            key="advanced"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full w-full grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_420px] gap-6 overflow-y-auto pb-4"
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
                                            onClick={() => { setTsqlType('clerks'); setIsTsqlOpen(true); }}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
                                        >
                                            <Code2 className="w-3.5 h-3.5" /> {t('viewTsql')}
                                        </button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {MEMORY_CLERKS.map((clerk) => {
                                            const isActive = clerk.id === selectedClerk.id;
                                            const accentMap = {
                                                emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
                                                cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
                                                blue: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
                                                rose: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
                                                amber: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
                                                violet: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
                                            } as const;

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

                                    <div className="mt-5">
                                        <CopyCodeBlock code={selectedClerk.script} accent={selectedClerk.accent} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-pink-500/20">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-pink-400">
                                        <Sliders className="w-5 h-5" /> {t('minMaxMemoryTitle')}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">{t('minMaxMemoryDesc')}</p>

                                    <div className="space-y-6 mt-2">
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
                                                    style={{ width: `${((maxMemory - minMemory) / systemMemory) * 100}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-50" />
                                                    {maxMemory - minMemory > 2000 && 'Dynamic SQL'}
                                                </div>
                                                <div
                                                    className="bg-gray-500 flex items-center justify-center text-xs font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-300"
                                                    style={{ width: `${((systemMemory - maxMemory) / systemMemory) * 100}%` }}
                                                >
                                                    {systemMemory - maxMemory > 2000 && 'OS'}
                                                </div>
                                            </div>
                                            <p className="text-xs text-center text-muted-foreground mt-2 mb-4">
                                                OS Memory: {systemMemory - maxMemory} MB
                                            </p>
                                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs text-left flex items-start gap-3 leading-relaxed mt-2">
                                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                                <span>{t('osMemoryWarning')}</span>
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <TSqlModal
                isOpen={isTsqlOpen}
                onClose={() => setIsTsqlOpen(false)}
                title={tsqlType === 'clerks' ? t('memTsqlTitle') : t('memLpimTsqlTitle')}
                description={tsqlType === 'clerks' ? t('memTsqlDesc') : t('memLpimTsqlDesc')}
                diagnosticScript={{
                    '2019': tsqlType === 'clerks'
                        ? `-- Top Memory Clerks by usage\nSELECT TOP 15\n  type AS clerk_type,\n  name AS clerk_name,\n  SUM(pages_kb) / 1024 AS used_mb,\n  SUM(virtual_memory_committed_kb) / 1024 AS vm_mb,\n  SUM(awe_allocated_kb) / 1024 AS awe_mb,\n  COUNT(*) AS numa_nodes\nFROM sys.dm_os_memory_clerks\nGROUP BY type, name\nORDER BY used_mb DESC;\n\n-- Total memory by clerk category\nSELECT type,\n  SUM(pages_kb) / 1024 AS total_mb,\n  ROUND(SUM(pages_kb) * 100.0 / SUM(SUM(pages_kb)) OVER(), 1) AS pct\nFROM sys.dm_os_memory_clerks\nGROUP BY type\nORDER BY total_mb DESC;`
                        : `DBCC MEMORYSTATUS;`,
                    '2022': tsqlType === 'clerks'
                        ? `-- Top Memory Clerks by usage\nSELECT TOP 15\n  type AS clerk_type,\n  name AS clerk_name,\n  SUM(pages_kb) / 1024 AS used_mb,\n  SUM(virtual_memory_committed_kb) / 1024 AS vm_mb,\n  SUM(awe_allocated_kb) / 1024 AS awe_mb,\n  COUNT(*) AS numa_nodes\nFROM sys.dm_os_memory_clerks\nGROUP BY type, name\nORDER BY used_mb DESC;\n\n-- Total memory by clerk category\nSELECT type,\n  SUM(pages_kb) / 1024 AS total_mb,\n  ROUND(SUM(pages_kb) * 100.0 / SUM(SUM(pages_kb)) OVER(), 1) AS pct\nFROM sys.dm_os_memory_clerks\nGROUP BY type\nORDER BY total_mb DESC;`
                        : `DBCC MEMORYSTATUS;`,
                    '2025': tsqlType === 'clerks'
                        ? `-- Top Memory Clerks by usage\nSELECT TOP 15\n  type AS clerk_type,\n  name AS clerk_name,\n  SUM(pages_kb) / 1024 AS used_mb,\n  SUM(virtual_memory_committed_kb) / 1024 AS vm_mb,\n  SUM(awe_allocated_kb) / 1024 AS awe_mb,\n  COUNT(*) AS numa_nodes\nFROM sys.dm_os_memory_clerks\nGROUP BY type, name\nORDER BY used_mb DESC;\n\n-- Total memory by clerk category\nSELECT type,\n  SUM(pages_kb) / 1024 AS total_mb,\n  ROUND(SUM(pages_kb) * 100.0 / SUM(SUM(pages_kb)) OVER(), 1) AS pct\nFROM sys.dm_os_memory_clerks\nGROUP BY type\nORDER BY total_mb DESC;`
                        : `DBCC MEMORYSTATUS;`
                }}
                remediationTitle={tsqlType === 'clerks' ? t('memRemediationTitle') : t('memLpimRemediationTitle')}
                remediationScript={{
                    '2019': tsqlType === 'clerks'
                        ? `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192;\nRECONFIGURE;`
                        : `-- 1. Open secpol.msc\n-- 2. Local Policies -> User Rights Assignment\n-- 3. Double-click "Lock pages in memory"\n-- 4. Add the SQL Server service account\n-- 5. Restart SQL Server service`,
                    '2022': tsqlType === 'clerks'
                        ? `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192;\nRECONFIGURE;`
                        : `-- 1. Open secpol.msc\n-- 2. Local Policies -> User Rights Assignment\n-- 3. Double-click "Lock pages in memory"\n-- 4. Add the SQL Server service account\n-- 5. Restart SQL Server service`,
                    '2025': tsqlType === 'clerks'
                        ? `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192;\nRECONFIGURE;`
                        : `-- 1. Open secpol.msc\n-- 2. Local Policies -> User Rights Assignment\n-- 3. Double-click "Lock pages in memory"\n-- 4. Add the SQL Server service account\n-- 5. Restart SQL Server service`
                }}
            />
        </div>
    );
}
