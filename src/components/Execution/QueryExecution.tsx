import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Lock, ShieldAlert, Cpu, Database, Activity, Code2, GitMerge, FileSearch, ChartBar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';
import { PlanOperatorLab } from './PlanOperatorLab';

type WaitType = 'none' | 'lock' | 'latch' | 'spinlock';

interface QueryState {
    id: number;
    status: 'parsing' | 'optimizing' | 'executing' | 'suspended' | 'runnable' | 'running' | 'done';
    waitType: WaitType;
    progress: number;
}

interface LocalText {
    en: string;
    es: string;
}

type OptimizerExampleId = 'seek-covering' | 'lookup-loops' | 'hash-join' | 'sort-order';

interface PlanNode {
    label: string;
    summary: LocalText;
    accent: string;
}

interface OptimizerExample {
    id: OptimizerExampleId;
    title: LocalText;
    query: string;
    planTitle: LocalText;
    why: LocalText;
    reuse: LocalText;
    invalidation: LocalText;
    nodes: PlanNode[];
}

const OPTIMIZER_PHASES: Array<{ title: LocalText; detail: LocalText; chip: string }> = [
    {
        title: { en: '1. Parse', es: '1. Parse' },
        detail: {
            en: 'SQL tokenizes and validates the T-SQL syntax. If the text is invalid, no plan exists yet.',
            es: 'SQL trocea y valida la sintaxis T-SQL. Si el texto es inválido, aún no existe ningún plan.',
        },
        chip: 'border-blue-500/25 bg-blue-500/10 text-blue-200',
    },
    {
        title: { en: '2. Bind / Algebrize', es: '2. Bind / Algebrizer' },
        detail: {
            en: 'Objects, columns, types and permissions are bound. Here SQL knows which tables, indexes and datatypes are involved.',
            es: 'Se enlazan objetos, columnas, tipos y permisos. Aquí SQL ya sabe qué tablas, índices y tipos participan.',
        },
        chip: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
    },
    {
        title: { en: '3. Optimize', es: '3. Optimize' },
        detail: {
            en: 'The optimizer estimates rows from statistics, enumerates alternatives and picks the cheapest estimated shape.',
            es: 'El optimizador estima filas usando estadísticas, genera alternativas y elige la forma con menor coste estimado.',
        },
        chip: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
    },
    {
        title: { en: '4. Cache / Reuse', es: '4. Cache / Reuse' },
        detail: {
            en: 'If the text, SET options and schema still match, SQL can reuse the compiled plan instead of recompiling.',
            es: 'Si el texto, las opciones SET y el esquema siguen cuadrando, SQL puede reutilizar el plan compilado en vez de recompilar.',
        },
        chip: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
    },
];

const OPTIMIZER_EXAMPLES: OptimizerExample[] = [
    {
        id: 'seek-covering',
        title: { en: 'Covering index -> seek only', es: 'Índice cubriente -> solo seek' },
        query: "SELECT Name, Dept FROM dbo.Employees WHERE Salary = 62000;",
        planTitle: { en: 'Index Seek -> return rows', es: 'Index Seek -> devolver filas' },
        why: {
            en: 'Predicate is selective and the nonclustered index already contains every requested column.',
            es: 'El predicado es selectivo y el índice no clusterizado ya contiene todas las columnas pedidas.',
        },
        reuse: {
            en: 'This is the ideal reusable plan shape when rowcount stays stable for the same predicate pattern.',
            es: 'Esta es la forma ideal de plan reutilizable cuando el número de filas se mantiene estable para el mismo patrón de predicado.',
        },
        invalidation: {
            en: 'Stats update, schema change or different SET options can force a fresh compile.',
            es: 'Una actualización de estadísticas, un cambio de esquema o distintas opciones SET pueden forzar una nueva compilación.',
        },
        nodes: [
            {
                label: 'Index Seek',
                summary: {
                    en: 'Walks root -> branch -> leaf using the index key.',
                    es: 'Recorre raíz -> rama -> hoja usando la clave del índice.',
                },
                accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
            },
            {
                label: 'Output',
                summary: {
                    en: 'Rows already contain every needed column.',
                    es: 'Las filas ya contienen todas las columnas necesarias.',
                },
                accent: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
            },
        ],
    },
    {
        id: 'lookup-loops',
        title: { en: 'Selective estimate -> loops + lookup', es: 'Estimación selectiva -> loops + lookup' },
        query: "SELECT SalesOrderID, CustomerID, ShipAddress FROM Sales.Orders WHERE Status = 'Open';",
        planTitle: { en: 'Index Seek -> Nested Loops -> Key Lookup', es: 'Index Seek -> Nested Loops -> Key Lookup' },
        why: {
            en: 'The optimizer expects few rows, so repeated point fetches look cheaper than a broad scan.',
            es: 'El optimizador espera pocas filas, así que varios fetches puntuales parecen más baratos que un scan amplio.',
        },
        reuse: {
            en: 'If the first compile sniffs a selective value, the same plan can later be reused for a much fatter value.',
            es: 'Si la primera compilación “sniffea” un valor muy selectivo, el mismo plan puede reutilizarse luego para un valor mucho más gordo.',
        },
        invalidation: {
            en: 'Bad reuse usually appears with parameter sniffing, skewed distributions or new statistics.',
            es: 'La mala reutilización suele aparecer con parameter sniffing, distribuciones sesgadas o estadísticas nuevas.',
        },
        nodes: [
            {
                label: 'Index Seek',
                summary: {
                    en: 'Finds candidate keys fast in the nonclustered index.',
                    es: 'Encuentra rápido las claves candidatas en el índice no clusterizado.',
                },
                accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
            },
            {
                label: 'Nested Loops',
                summary: {
                    en: 'For each outer row, launches the inner fetch.',
                    es: 'Por cada fila externa, dispara la búsqueda interna.',
                },
                accent: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
            },
            {
                label: 'Key Lookup',
                summary: {
                    en: 'Uses the clustered key to fetch columns missing from the NCI.',
                    es: 'Usa la clave clustered para traer las columnas que faltan en el NCI.',
                },
                accent: 'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-200',
            },
        ],
    },
    {
        id: 'hash-join',
        title: { en: 'Large join -> hash match', es: 'Join grande -> hash match' },
        query: "SELECT c.CustomerID, SUM(f.Amount) FROM FactSales f JOIN DimCustomer c ON f.CustomerKey = c.CustomerKey GROUP BY c.CustomerID;",
        planTitle: { en: 'Scan -> Hash Match -> Aggregate', es: 'Scan -> Hash Match -> Aggregate' },
        why: {
            en: 'When inputs are large and unsorted, building a hash table can beat thousands of random seeks.',
            es: 'Cuando las entradas son grandes y no están ordenadas, construir una hash table puede ganar a miles de seeks aleatorios.',
        },
        reuse: {
            en: 'The shape can reuse well if cardinality is stable and the memory grant is still valid.',
            es: 'La forma puede reutilizarse bien si la cardinalidad es estable y el memory grant sigue siendo válido.',
        },
        invalidation: {
            en: 'If row estimates drift, the same plan may spill to tempdb and stop being healthy.',
            es: 'Si las estimaciones se desvían, el mismo plan puede empezar a derramar a tempdb y dejar de ser sano.',
        },
        nodes: [
            {
                label: 'Index / Table Scan',
                summary: {
                    en: 'Reads wide inputs because no cheap selective path exists.',
                    es: 'Lee entradas amplias porque no existe una ruta selectiva barata.',
                },
                accent: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
            },
            {
                label: 'Hash Match',
                summary: {
                    en: 'Builds buckets from one side and probes them with the other.',
                    es: 'Construye buckets con un lado y hace probe con el otro.',
                },
                accent: 'border-violet-500/25 bg-violet-500/10 text-violet-200',
            },
            {
                label: 'Aggregate',
                summary: {
                    en: 'Collapses rows after the join result is materialized.',
                    es: 'Agrupa y resume las filas tras materializar el join.',
                },
                accent: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
            },
        ],
    },
    {
        id: 'sort-order',
        title: { en: 'No ordered path -> sort', es: 'Sin ruta ordenada -> sort' },
        query: "SELECT TOP (5000) Name, OrderTotal FROM Sales.Invoice ORDER BY OrderTotal DESC;",
        planTitle: { en: 'Seek/Scan -> Sort -> Top', es: 'Seek/Scan -> Sort -> Top' },
        why: {
            en: 'If no index already delivers the needed order, SQL must sort before returning rows.',
            es: 'Si ningún índice entrega ya el orden necesario, SQL tiene que ordenar antes de devolver las filas.',
        },
        reuse: {
            en: 'A stable rowcount can keep this plan healthy, but growth can turn the same sort into a tempdb spill.',
            es: 'Un volumen estable puede mantener sano este plan, pero si crece la carga el mismo sort puede acabar haciendo spill a tempdb.',
        },
        invalidation: {
            en: 'An index aligned with ORDER BY can replace the sort on the next compile.',
            es: 'Un índice alineado con el ORDER BY puede reemplazar el sort en la siguiente compilación.',
        },
        nodes: [
            {
                label: 'Read path',
                summary: {
                    en: 'Rows are read in a non-useful order for the final output.',
                    es: 'Las filas se leen en un orden no útil para la salida final.',
                },
                accent: 'border-blue-500/25 bg-blue-500/10 text-blue-200',
            },
            {
                label: 'Sort',
                summary: {
                    en: 'Orders the rowset in memory or tempdb.',
                    es: 'Ordena el conjunto en memoria o tempdb.',
                },
                accent: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
            },
            {
                label: 'Top',
                summary: {
                    en: 'Returns the first rows only after the correct order exists.',
                    es: 'Devuelve las primeras filas solo después de que exista el orden correcto.',
                },
                accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
            },
        ],
    },
];

function pickText(language: 'en' | 'es', text: LocalText) {
    return language === 'es' ? text.es : text.en;
}

export function QueryExecution() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'execution' | 'optimizer' | 'dmvs'>('execution');
    const [activeOptimizerPhase, setActiveOptimizerPhase] = useState(2);
    const [activePlanExampleId, setActivePlanExampleId] = useState<OptimizerExampleId>('lookup-loops');
    const [queries, setQueries] = useState<QueryState[]>([]);
    const [activeWaitType, setActiveWaitType] = useState<WaitType>('none');
    const [logs, setLogs] = useState<string[]>(['System idle...']);
    const [isTsqlOpen, setIsTsqlOpen] = useState(false);

    const activeOptimizerExample = OPTIMIZER_EXAMPLES.find((example) => example.id === activePlanExampleId) ?? OPTIMIZER_EXAMPLES[0];

    const addLog = (msg: string) => setLogs(p => [msg, ...p].slice(0, 5));

    const simulateQuery = (waitScenario: WaitType) => {
        const newId = Date.now();
        setQueries(p => [...p, { id: newId, status: 'parsing', waitType: waitScenario, progress: 0 }]);
        addLog(`Q${newId.toString().slice(-4)}: Received by SNI. Status: ${t('statusParsing')}.`);
        setActiveWaitType(waitScenario);

        // Parse (1s) -> Optimize (1s) -> Execute (variable)
        setTimeout(() => {
            setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'optimizing', progress: 20 } : q));
            addLog(`Q${newId.toString().slice(-4)}: Parsed. Algebrizer complete. Status: ${t('statusOptimizing')}.`);
        }, 1000);

        setTimeout(() => {
            if (waitScenario !== 'none') {
                if (waitScenario === 'spinlock') {
                    setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'running', progress: 50 } : q));
                    addLog(`Q${newId.toString().slice(-4)}: Plan created. WARNING: Hit ${waitScenario.toUpperCase()} WAIT. Thread is BURNiNG CPU (${t('statusRunning')}).`);

                    setTimeout(() => {
                        setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'done', progress: 100 } : q));
                        addLog(`Q${newId.toString().slice(-4)}: Execution COMPLETE.`);
                        setActiveWaitType('none');
                    }, 2000);
                } else {
                    setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'suspended', progress: 50 } : q));
                    addLog(`Q${newId.toString().slice(-4)}: Plan created. WARNING: Hit ${waitScenario.toUpperCase()} WAIT. Thread yielded CPU (${t('statusSuspended')}).`);

                    setTimeout(() => {
                        setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'runnable', progress: 65 } : q));
                        addLog(`Q${newId.toString().slice(-4)}: ${waitScenario.toUpperCase()} wait resolved. Moved to ${t('statusRunnable')} queue.`);
                        setActiveWaitType('none');

                        setTimeout(() => {
                            setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'running', progress: 80 } : q));
                            addLog(`Q${newId.toString().slice(-4)}: Scheduled on CPU. Status: ${t('statusRunning')}.`);

                            setTimeout(() => {
                                setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'done', progress: 100 } : q));
                                addLog(`Q${newId.toString().slice(-4)}: Execution COMPLETE.`);
                            }, 1000);
                        }, 1000);

                    }, 2500);
                }

            } else {
                setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'executing', progress: 60 } : q));
                addLog(`Q${newId.toString().slice(-4)}: Plan created. Status: ${t('statusExecuting')}.`);

                setTimeout(() => {
                    setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'done', progress: 100 } : q));
                    addLog(`Q${newId.toString().slice(-4)}: Execution COMPLETE.`);
                }, 1500);
            }
        }, 2000);
    };

    return (
        <div className="flex min-h-full flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-red-400">
                            {t('qeTitle')}
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            {t('qeDescription')}
                        </p>
                    </div>
                </div>

                <div className="glass-panel flex w-full flex-wrap rounded-xl border border-white/10 bg-white/5 p-1 sm:w-fit">
                    <button
                        onClick={() => setActiveTab('execution')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'execution' ? "bg-amber-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Activity className="w-4 h-4" />
                        {t('tabExecution')}
                    </button>
                    <button
                        onClick={() => setActiveTab('optimizer')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'optimizer' ? "bg-red-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <GitMerge className="w-4 h-4" />
                        {t('tabOptimizer')}
                    </button>
                    <button
                        onClick={() => setActiveTab('dmvs')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'dmvs' ? "bg-cyan-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <FileSearch className="w-4 h-4" />
                        {t('tabDMVs')}
                    </button>
                </div>
            </div>

            <div className="relative min-h-0 flex-1">
                <AnimatePresence mode="wait">
                    {activeTab === 'execution' && (
                        <motion.div
                            key="execution"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="min-h-full flex flex-col gap-6 overflow-y-auto pb-4"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                                {/* Simulators */}
                                <div className="flex flex-col gap-4">
                                    <div className="glass-panel p-6 rounded-2xl border-white/10 flex flex-col gap-4 shadow-glass">
                                        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                            <Play className="w-5 h-5 text-emerald-400" /> {t('runNewQuery')}
                                        </h3>

                                        <button
                                            onClick={() => simulateQuery('none')}
                                            className="p-4 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl text-left transition-colors flex flex-col group"
                                        >
                                            <span className="font-bold text-emerald-400 flex items-center gap-2">
                                                <Activity className="w-4 h-4" /> {t('runNormalQuery')}
                                            </span>
                                            <span className="text-xs text-muted-foreground mt-1 group-hover:text-emerald-100/70">{t('runNormalQueryDesc')}</span>
                                        </button>

                                        <button
                                            onClick={() => simulateQuery('lock')}
                                            className="p-4 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-left transition-colors flex flex-col group"
                                        >
                                            <span className="font-bold text-amber-400 flex items-center gap-2">
                                                <Lock className="w-4 h-4" /> {t('runLockQuery')}
                                            </span>
                                            <span className="text-xs text-muted-foreground mt-1 group-hover:text-amber-100/70">{t('runLockQueryDesc')}</span>
                                        </button>

                                        <button
                                            onClick={() => simulateQuery('latch')}
                                            className="p-4 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 rounded-xl text-left transition-colors flex flex-col group"
                                        >
                                            <span className="font-bold text-rose-400 flex items-center gap-2">
                                                <Database className="w-4 h-4" /> {t('runLatchQuery')}
                                            </span>
                                            <span className="text-xs text-muted-foreground mt-1 group-hover:text-rose-100/70">{t('runLatchQueryDesc')}</span>
                                        </button>

                                        <button
                                            onClick={() => simulateQuery('spinlock')}
                                            className="p-4 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 rounded-xl text-left transition-colors flex flex-col group"
                                        >
                                            <span className="font-bold text-purple-400 flex items-center gap-2">
                                                <Cpu className="w-4 h-4" /> {t('runSpinlockQuery')}
                                            </span>
                                            <span className="text-xs text-muted-foreground mt-1 group-hover:text-purple-100/70">{t('runSpinlockQueryDesc')}</span>
                                        </button>
                                    </div>

                                    {/* Wait Concepts */}
                                    <div className="glass-panel p-6 rounded-2xl border-white/10 flex-1 flex flex-col gap-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4" /> {t('waitSemanticsTitle')}</h3>
                                            <button
                                                onClick={() => setIsTsqlOpen(true)}
                                                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
                                            >
                                                <Code2 className="w-3.5 h-3.5" /> {t('viewTsql')}
                                            </button>
                                        </div>
                                        <div className="space-y-4 text-sm">
                                            <div className={cn("p-3 rounded-lg border", activeWaitType === 'lock' ? "bg-amber-500/20 border-amber-500/50" : "bg-black/20 border-white/5")}>
                                                <strong className="text-amber-400 block mb-1">{t('lockWaitTitle')}</strong>
                                                {t('lockWaitDesc')}
                                            </div>
                                            <div className={cn("p-3 rounded-lg border", activeWaitType === 'latch' ? "bg-rose-500/20 border-rose-500/50" : "bg-black/20 border-white/5")}>
                                                <strong className="text-rose-400 block mb-1">{t('latchWaitTitle')}</strong>
                                                {t('latchWaitDesc')}
                                            </div>
                                            <div className={cn("p-3 rounded-lg border", activeWaitType === 'spinlock' ? "bg-purple-500/20 border-purple-500/50" : "bg-black/20 border-white/5")}>
                                                <strong className="text-purple-400 block mb-1">{t('spinlockWaitTitle')}</strong>
                                                {t('spinlockWaitDesc')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Query Monitoring Board */}
                                <div className="lg:col-span-2 flex flex-col gap-6">
                                    <div className="glass-panel p-6 rounded-2xl border-white/10 flex-1 relative overflow-hidden flex flex-col h-full">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

                                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4 z-10">
                                            <Activity className="w-5 h-5 text-emerald-400" /> {t('activeRequestsTitle')}
                                        </h3>

                                        <div className="flex-1 overflow-y-auto space-y-4 z-10">
                                            <AnimatePresence>
                                                {queries.length === 0 && (
                                                    <div className="text-center text-muted-foreground mt-10 opacity-50">
                                                        {t('noActiveQueries')}
                                                    </div>
                                                )}
                                                {queries.slice().reverse().map(query => (
                                                    <motion.div
                                                        key={query.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        layout
                                                        className={cn(
                                                            "p-4 rounded-xl flex flex-col gap-3 border shadow-lg transition-colors",
                                                            query.status === 'done' ? "bg-emerald-500/10 border-emerald-500/30 opacity-70" :
                                                                query.status === 'suspended' ? "bg-rose-500/10 border-rose-500/50 shadow-glow" :
                                                                    query.status === 'runnable' ? "bg-blue-500/10 border-blue-500/50 shadow-glowBlue" :
                                                                        query.status === 'running' ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]" :
                                                                            "bg-white/5 border-white/10"
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded text-sm">
                                                            <span className="font-mono text-cyan-400">SPID 5{query.id % 9}</span>
                                                            <span className={cn(
                                                                "font-bold uppercase text-xs px-2 py-0.5 rounded transition-colors",
                                                                query.status === 'done' ? "bg-emerald-500/20 text-emerald-400" :
                                                                    query.status === 'suspended' ? "bg-rose-500/20 text-rose-400 animate-pulse" :
                                                                        query.status === 'runnable' ? "bg-blue-500/20 text-blue-400" :
                                                                            query.status === 'running' ? "bg-purple-500/20 text-purple-400 animate-pulse" :
                                                                                "bg-white/10 text-white/70"
                                                            )}>
                                                                {query.status === 'parsing' && t('statusParsing')}
                                                                {query.status === 'optimizing' && t('statusOptimizing')}
                                                                {query.status === 'executing' && t('statusExecuting')}
                                                                {query.status === 'suspended' && t('statusSuspended')}
                                                                {query.status === 'runnable' && t('statusRunnable')}
                                                                {query.status === 'running' && t('statusRunning')}
                                                                {query.status === 'done' && t('statusDone')}
                                                            </span>
                                                        </div>

                                                        {/* Execution Pipeline */}
                                                        <div className="flex items-center justify-between text-xs font-semibold px-2">
                                                            <span className={query.progress >= 0 ? "text-white" : "text-muted-foreground"}>{t('pipelineParser')}</span>
                                                            <div className={cn("flex-1 h-0.5 mx-2 bg-gradient-to-r transition-all duration-500", query.progress >= 20 ? "from-emerald-500 to-emerald-500" : "from-white/10 to-white/10")} />
                                                            <span className={query.progress >= 20 ? "text-white" : "text-muted-foreground"}>{t('pipelineOptimizer')}</span>
                                                            <div className={cn("flex-1 h-0.5 mx-2 bg-gradient-to-r transition-all duration-500", query.progress >= 50 ? "from-emerald-500 to-emerald-500" : "from-white/10 to-white/10")} />
                                                            <span className={query.progress >= 50 ? (query.status === 'suspended' ? 'text-rose-400' : query.status === 'running' ? 'text-purple-400' : "text-white") : "text-muted-foreground"}>
                                                                {t('pipelineExecutor')}
                                                            </span>
                                                        </div>

                                                        {query.status === 'suspended' && (
                                                            <div className="bg-rose-500/20 text-rose-300 text-xs p-2 rounded flex items-center gap-2 mt-1 border border-rose-500/30">
                                                                <ShieldAlert className="w-4 h-4 animate-bounce" />
                                                                {t('waitingOn')} {query.waitType.toUpperCase()}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="glass-panel p-4 rounded-xl border-white/10 max-h-48 overflow-y-auto w-full">
                                        <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">{t('engineLogTitle')}</h4>
                                        <div className="space-y-1 font-mono text-xs">
                                            {logs.map((log, i) => (
                                                <div key={i} className={i === 0 ? "text-white" : "text-muted-foreground opacity-70"}>
                                                    <span className="text-blue-400 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                                    {log}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'optimizer' && (
                        <motion.div
                            key="optimizer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="min-h-full w-full overflow-y-auto pb-4"
                        >
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
                                <div className="glass-panel rounded-3xl border border-red-500/20 p-4 sm:p-6">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="max-w-4xl">
                                            <h3 className="text-xl font-bold flex items-center gap-2 text-red-400">
                                                <GitMerge className="w-5 h-5" /> {t('optTitle')}
                                            </h3>
                                            <p className="mt-2 text-sm leading-7 text-white/75">
                                                {language === 'es'
                                                    ? 'Aquí ves cómo nace el plan, por qué puede reutilizarse desde caché y qué forma toma según estadísticas, índice, orden requerido y volumen real.'
                                                    : 'Here you see how the plan is born, why it can be reused from cache, and which shape it takes depending on statistics, index, required order, and real volume.'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/60">query_hash</span>
                                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/60">plan_handle</span>
                                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/60">stats</span>
                                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/60">SET options</span>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-3 xl:grid-cols-4">
                                        {OPTIMIZER_PHASES.map((phase, index) => {
                                            const isActive = index === activeOptimizerPhase;
                                            return (
                                                <button
                                                    key={phase.title.en}
                                                    onClick={() => setActiveOptimizerPhase(index)}
                                                    className={cn('rounded-2xl border p-4 text-left transition-all', isActive ? phase.chip : 'border-white/10 bg-black/20 text-white/70 hover:border-white/20')}
                                                >
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em]">
                                                        {pickText(language, phase.title)}
                                                    </div>
                                                    <p className="mt-2 text-xs leading-6">{pickText(language, phase.detail)}</p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_300px]">
                                        <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                                            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                                                {language === 'es' ? 'Qué pasa en esta fase' : 'What happens in this phase'}
                                            </div>
                                            <h4 className="mt-2 text-xl font-black text-white">{pickText(language, OPTIMIZER_PHASES[activeOptimizerPhase]?.title ?? OPTIMIZER_PHASES[0].title)}</h4>
                                            <p className="mt-3 text-sm leading-7 text-white/80">{pickText(language, OPTIMIZER_PHASES[activeOptimizerPhase]?.detail ?? OPTIMIZER_PHASES[0].detail)}</p>

                                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                {[
                                                    {
                                                        title: language === 'es' ? 'Compilación' : 'Compilation',
                                                        value: language === 'es' ? 'Se crea una forma de plan' : 'A plan shape is created',
                                                    },
                                                    {
                                                        title: language === 'es' ? 'Reutilización' : 'Reuse',
                                                        value: language === 'es' ? 'Puede saltarse la compilación' : 'Can skip recompilation',
                                                    },
                                                    {
                                                        title: language === 'es' ? 'Recompila si' : 'Recompiles if',
                                                        value: language === 'es' ? 'Cambian stats, schema o SET' : 'Stats, schema or SET options change',
                                                    },
                                                ].map((card) => (
                                                    <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{card.title}</div>
                                                        <div className="mt-2 text-sm font-bold text-white">{card.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">
                                                {language === 'es' ? 'Cache y reutilización' : 'Cache and reuse'}
                                            </div>
                                            <div className="mt-3 space-y-3 text-sm leading-7 text-white/80">
                                                <p>
                                                    {language === 'es'
                                                        ? 'El motor guarda el plan compilado en caché y lo reutiliza si el texto, el contexto y las opciones siguen siendo equivalentes.'
                                                        : 'The engine stores the compiled plan in cache and reuses it if text, context, and options still match.'}
                                                </p>
                                                <p>
                                                    {language === 'es'
                                                        ? 'Eso ahorra CPU, pero también puede reutilizar una mala forma de plan si el primer valor compilado no representa bien al resto.'
                                                        : 'That saves CPU, but it can also reuse a bad plan shape if the first compiled value does not represent later executions.'}
                                                </p>
                                                <p className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                                    {language === 'es'
                                                        ? 'Aquí es donde entran parameter sniffing, update stats, OPTION(RECOMPILE), plan guides o Query Store.'
                                                        : 'This is where parameter sniffing, update stats, OPTION(RECOMPILE), plan guides, or Query Store come in.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel rounded-3xl border border-amber-500/20 p-4 sm:p-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                                        <ChartBar className="w-5 h-5" /> {t('statsTitle')}
                                    </h3>
                                    <p className="mt-2 text-sm leading-7 text-white/75">
                                        {language === 'es'
                                            ? 'El optimizador no adivina: estima cardinalidad a partir de estadísticas e histogramas. Si esa estimación sale mal, puede elegir un plan muy malo aunque el operador “suene” correcto.'
                                            : 'The optimizer does not guess: it estimates cardinality from statistics and histograms. If that estimate goes wrong, it can choose a very bad plan even if the operator name sounds right.'}
                                    </p>

                                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                                        <div className="flex items-end gap-2 h-32 ml-4 mb-4 border-b border-white/20 pb-1">
                                            <div className="w-8 bg-blue-500/50 h-[20%] rounded-t" />
                                            <div className="w-8 bg-blue-500/60 h-[50%] rounded-t" />
                                            <div className="w-8 bg-blue-500/80 h-[90%] rounded-t" />
                                            <div className="w-8 bg-blue-500/40 h-[30%] rounded-t" />
                                            <div className="w-8 bg-blue-500/30 h-[10%] rounded-t" />
                                            <div className="w-8 bg-amber-500/80 h-[100%] rounded-t shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-400/50" />
                                            <div className="w-8 bg-blue-500/20 h-[5%] rounded-t" />
                                        </div>
                                        <div className="text-xs text-center text-muted-foreground font-mono">
                                            sys.stats_columns / DBCC SHOW_STATISTICS
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {[
                                            language === 'es' ? 'Pocas filas esperadas -> suele gustarle Seek + Nested Loops.' : 'Few expected rows -> often favors Seek + Nested Loops.',
                                            language === 'es' ? 'Muchas filas / entrada ancha -> suele empujar hacia Hash Match o Scan.' : 'Many rows / wide input -> often pushes toward Hash Match or Scan.',
                                            language === 'es' ? 'ORDER BY sin índice alineado -> aparece Sort.' : 'ORDER BY without aligned index -> Sort appears.',
                                        ].map((item) => (
                                            <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-7 text-white/75">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 glass-panel rounded-3xl border border-fuchsia-500/20 p-4 sm:p-6">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                    <div className="max-w-4xl">
                                        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-fuchsia-300/80">
                                            {language === 'es' ? 'Ejemplos de creación de planes' : 'Plan creation examples'}
                                        </div>
                                        <h3 className="mt-2 text-2xl font-black text-white">
                                            {language === 'es' ? 'Cómo acaba montándose cada plan' : 'How each plan shape gets assembled'}
                                        </h3>
                                        <p className="mt-3 text-sm leading-7 text-white/75">
                                            {language === 'es'
                                                ? 'Cada ejemplo enseña la query, la forma de plan elegida, por qué la eligió el optimizador y cuándo esa misma forma se vuelve peligrosa al reutilizarse.'
                                                : 'Each example shows the query, the chosen plan shape, why the optimizer chose it, and when the same shape becomes dangerous when reused.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {OPTIMIZER_EXAMPLES.map((example) => (
                                        <button
                                            key={example.id}
                                            onClick={() => setActivePlanExampleId(example.id)}
                                            className={cn('rounded-2xl border px-4 py-2 text-sm font-bold transition-all', activeOptimizerExample.id === example.id ? 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-200' : 'border-white/10 bg-black/20 text-white/65 hover:border-white/20 hover:text-white')}
                                        >
                                            {pickText(language, example.title)}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_340px]">
                                    <div className="min-w-0">
                                        <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                                                {language === 'es' ? 'Query que compila' : 'Query being compiled'}
                                            </div>
                                            <div className="mt-4">
                                                <CopyCodeBlock code={activeOptimizerExample.query} accent="cyan" contentClassName="max-h-[160px]" />
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                                                        {language === 'es' ? 'Forma de plan elegida' : 'Chosen plan shape'}
                                                    </div>
                                                    <h4 className="mt-2 text-xl font-black text-white">{pickText(language, activeOptimizerExample.planTitle)}</h4>
                                                </div>
                                                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/60">
                                                    {language === 'es' ? 'Compila y luego reutiliza' : 'Compile then reuse'}
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-3 lg:grid-cols-3">
                                                {activeOptimizerExample.nodes.map((node) => (
                                                    <div key={`${activeOptimizerExample.id}-${node.label}`} className={cn('rounded-2xl border p-4', node.accent)}>
                                                        <div className="text-sm font-black">{node.label}</div>
                                                        <p className="mt-2 text-sm leading-7 text-white/80">{pickText(language, node.summary)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                                                {language === 'es' ? 'Por qué sale este plan' : 'Why this plan appears'}
                                            </div>
                                            <p className="mt-3 text-sm leading-7 text-white/75">{pickText(language, activeOptimizerExample.why)}</p>
                                        </div>

                                        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                                                {language === 'es' ? 'Cómo se reutiliza' : 'How reuse works'}
                                            </div>
                                            <p className="mt-3 text-sm leading-7 text-white/75">{pickText(language, activeOptimizerExample.reuse)}</p>
                                        </div>

                                        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">
                                                {language === 'es' ? 'Cuándo deja de servir' : 'When it stops being healthy'}
                                            </div>
                                            <p className="mt-3 text-sm leading-7 text-white/80">{pickText(language, activeOptimizerExample.invalidation)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <PlanOperatorLab />
                        </motion.div>
                    )}

                    {activeTab === 'dmvs' && (
                        <motion.div
                            key="dmvs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="min-h-full w-full overflow-y-auto pb-4"
                        >
                            <div className="glass-panel flex w-full min-h-full flex-col gap-6 rounded-3xl border border-cyan-500/20 p-4 sm:p-6">
                                <h3 className="text-2xl font-bold flex items-center gap-2 text-cyan-400">
                                    <FileSearch className="w-6 h-6" /> {t('dmvTitle')}
                                </h3>
                                <p className="text-muted-foreground">{t('dmvDesc')}</p>

                                <div className="mt-2 grid grid-cols-1 gap-4 xl:grid-cols-3">
                                    <div className="min-w-0 rounded-2xl border border-white/5 bg-black/30 p-5 transition-colors hover:border-emerald-500/40">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Activity className="text-emerald-400 w-5 h-5" />
                                            <h4 className="font-bold text-emerald-400">{t('dmvExecTitle')}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{t('dmvExecDesc')}</p>
                                        <div className="font-mono text-xs space-y-1">
                                            {['sys.dm_exec_requests','sys.dm_exec_sessions','sys.dm_exec_sql_text',
                                              'sys.dm_exec_query_plan','sys.dm_exec_query_stats','sys.dm_exec_connections'].map(v => (
                                                <div key={v} className="text-emerald-400/70 hover:text-emerald-300 cursor-default transition-colors py-0.5">{v}</div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="min-w-0 rounded-2xl border border-white/5 bg-black/30 p-5 transition-colors hover:border-purple-500/40">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Cpu className="text-purple-400 w-5 h-5" />
                                            <h4 className="font-bold text-purple-400">{t('dmvOsTitle')}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{t('dmvOsDesc')}</p>
                                        <div className="font-mono text-xs space-y-1">
                                            {['sys.dm_os_wait_stats','sys.dm_os_waiting_tasks','sys.dm_os_schedulers',
                                              'sys.dm_os_memory_clerks','sys.dm_os_ring_buffers','sys.dm_os_performance_counters'].map(v => (
                                                <div key={v} className="text-purple-400/70 hover:text-purple-300 cursor-default transition-colors py-0.5">{v}</div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="min-w-0 rounded-2xl border border-white/5 bg-black/30 p-5 transition-colors hover:border-amber-500/40">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Database className="text-amber-400 w-5 h-5" />
                                            <h4 className="font-bold text-amber-400">{t('dmvDbTitle')}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{t('dmvDbDesc')}</p>
                                        <div className="font-mono text-xs space-y-1">
                                            {['sys.dm_db_index_usage_stats','sys.dm_db_missing_index_details','sys.dm_db_partition_stats',
                                              'sys.dm_db_index_physical_stats','sys.dm_db_task_space_usage','sys.dm_db_log_space_usage'].map(v => (
                                                <div key={v} className="text-amber-400/70 hover:text-amber-300 cursor-default transition-colors py-0.5">{v}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Real T-SQL examples */}
                                <div className="min-w-0">
                                    <h4 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
                                        <Code2 className="w-5 h-5" /> {t('dmvExamplesLabel')}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-5">{t('dmvQueryDesc')}</p>
                                    <div className="space-y-4">
                                        {([
                                          { label: language === 'es' ? 'Bloqueadores activos y SQL asociado' : 'Active blockers and current SQL', border:'border-l-rose-500',
                                            code:`SELECT r.session_id, r.blocking_session_id,\n       r.wait_type, r.wait_time/1000 AS wait_sec,\n       DB_NAME(r.database_id) AS db_name,\n       t.text AS sql_text\nFROM sys.dm_exec_requests r\nCROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t\nWHERE r.blocking_session_id > 0\nORDER BY r.wait_time DESC;` },
                                          { label: language === 'es' ? 'Top CPU por query en cache' : 'Top CPU queries in cache', border:'border-l-amber-500',
                                            code:`SELECT TOP 10\n  qs.total_worker_time/qs.execution_count AS avg_cpu_us,\n  qs.execution_count,\n  qs.total_elapsed_time/qs.execution_count AS avg_elapsed_us,\n  SUBSTRING(qt.text, (qs.statement_start_offset/2)+1, 200) AS sql_text\nFROM sys.dm_exec_query_stats qs\nCROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt\nORDER BY avg_cpu_us DESC;` },
                                          { label: language === 'es' ? 'Top waits filtrando ruido' : 'Top wait types (filtered)', border:'border-l-purple-500',
                                            code:`SELECT TOP 15\n  wait_type,\n  wait_time_ms / 1000 AS wait_sec,\n  (wait_time_ms - signal_wait_time_ms)/1000 AS resource_sec,\n  signal_wait_time_ms / 1000 AS signal_sec,\n  waiting_tasks_count\nFROM sys.dm_os_wait_stats\nWHERE wait_type NOT IN (\n  'SLEEP_TASK','BROKER_TO_FLUSH','XE_DISPATCHER_WAIT',\n  'FT_IFTS_SCHEDULER_IDLE_WAIT','REQUEST_FOR_DEADLOCK_SEARCH',\n  'RESOURCE_QUEUE','SLEEP_MASTERDBREADY','SLEEP_DBSTARTUP')\nORDER BY wait_time_ms DESC;` },
                                          { label: language === 'es' ? 'Cadena de bloqueo + plantilla KILL' : 'Blocking chain + KILL template', border:'border-l-emerald-500',
                                            code:`SELECT wt.session_id,\n       wt.blocking_session_id,\n       wt.wait_type,\n       wt.wait_duration_ms / 1000.0 AS wait_sec,\n       er.command,\n       txt.text AS sql_text\nFROM sys.dm_os_waiting_tasks wt\nJOIN sys.dm_exec_requests er\n  ON wt.session_id = er.session_id\nCROSS APPLY sys.dm_exec_sql_text(er.sql_handle) txt\nWHERE wt.blocking_session_id > 0;\n\n-- Solo si validaste el impacto:\nKILL <blocking_session_id>;` },
                                          { label:'Memory clerks — top consumers', border:'border-l-cyan-500',
                                            code:`SELECT r.session_id,\n       r.status,\n       r.wait_type,\n       r.wait_time,\n       mg.requested_memory_kb,\n       mg.granted_memory_kb,\n       mg.used_memory_kb,\n       SUBSTRING(t.text, (r.statement_start_offset / 2) + 1, 200) AS sql_text\nFROM sys.dm_exec_requests r\nLEFT JOIN sys.dm_exec_query_memory_grants mg\n  ON r.session_id = mg.session_id\nCROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t\nWHERE r.session_id > 50\nORDER BY r.cpu_time DESC, r.logical_reads DESC;` },
                                        ] as {label:string; border:string; code:string}[]).map(({ label, border, code }) => (
                                            <div key={label} className={`bg-black/40 rounded-xl border-l-4 ${border} border border-white/5 overflow-hidden`}>
                                                <div className="px-4 py-2 bg-white/5 text-xs font-bold text-white/70 border-b border-white/5">
                                                    {code.includes('requested_memory_kb')
                                                        ? language === 'es'
                                                            ? 'Requests con grants e I/O pendiente'
                                                            : 'Requests with grants and pending I/O'
                                                        : label}
                                                </div>
                                                <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 text-[11px] font-mono leading-relaxed text-white/80 md:whitespace-pre">{code}</pre>
                                            </div>
                                        ))}
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
                title={t('qeTsqlTitle')}
                description={t('qeTsqlDesc')}
                diagnosticScript={{
                    '2019': `-- Active Requests & Waits\nSELECT session_id, status, wait_type, wait_time, wait_resource, command\nFROM sys.dm_exec_requests\nWHERE session_id > 50 AND status = 'suspended';\n\n-- Historical Wait Stats\nSELECT wait_type, wait_time_ms, max_wait_time_ms, signal_wait_time_ms\nFROM sys.dm_os_wait_stats\nWHERE wait_type IN ('LCK_M_X', 'PAGEIOLATCH_SH', 'SOS_WORK_DISPATCHER')\nORDER BY wait_time_ms DESC;`,
                    '2022': `-- Active Requests & Waits\nSELECT session_id, status, wait_type, wait_time, wait_resource, command\nFROM sys.dm_exec_requests\nWHERE session_id > 50 AND status = 'suspended';\n\n-- Historical Wait Stats\nSELECT wait_type, wait_time_ms, max_wait_time_ms, signal_wait_time_ms\nFROM sys.dm_os_wait_stats\nWHERE wait_type IN ('LCK_M_X', 'PAGEIOLATCH_SH', 'SOS_WORK_DISPATCHER')\nORDER BY wait_time_ms DESC;`,
                    '2025': `-- Active Requests & Waits\nSELECT session_id, status, wait_type, wait_time, wait_resource, command\nFROM sys.dm_exec_requests\nWHERE session_id > 50 AND status = 'suspended';\n\n-- Historical Wait Stats\nSELECT wait_type, wait_time_ms, max_wait_time_ms, signal_wait_time_ms\nFROM sys.dm_os_wait_stats\nWHERE wait_type IN ('LCK_M_X', 'PAGEIOLATCH_SH', 'SOS_WORK_DISPATCHER')\nORDER BY wait_time_ms DESC;`
                }}
                remediationTitle={t('qeRemediationTitle')}
                remediationScript={{
                    '2019': `-- Find blockers to fix LCK_M_X\nSELECT blocking_session_id, wait_duration_ms, session_id FROM sys.dm_os_waiting_tasks WHERE blocking_session_id IS NOT NULL;\n\n-- Address CXPACKET / Spinlocks with MAXDOP\nEXEC sp_configure 'show advanced options', 1; RECONFIGURE;\nEXEC sp_configure 'max degree of parallelism', 8; RECONFIGURE;`,
                    '2022': `-- Find blockers to fix LCK_M_X\nSELECT blocking_session_id, wait_duration_ms, session_id FROM sys.dm_os_waiting_tasks WHERE blocking_session_id IS NOT NULL;\n\n-- Query Store in 2022 helps find regressed plans causing latches\nSELECT q.query_id, p.plan_id, rs.avg_duration FROM sys.query_store_query q JOIN sys.query_store_plan p ON q.query_id = p.query_id JOIN sys.query_store_runtime_stats rs ON p.plan_id = rs.plan_id;`,
                    '2025': `-- Find blockers to fix LCK_M_X\nSELECT blocking_session_id, wait_duration_ms, session_id FROM sys.dm_os_waiting_tasks WHERE blocking_session_id IS NOT NULL;\n\n-- SQL 2025 Optimized Locking feature (already enabled for Azure SQL DB)\nALTER DATABASE CURRENT SET OPTIMIZED_LOCKING = ON;`
                }}
            />
        </div>
    );
}
