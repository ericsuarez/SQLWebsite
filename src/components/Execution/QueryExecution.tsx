import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Lock, ShieldAlert, Cpu, Database, Activity, Code2, GitMerge, FileSearch, ChartBar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';

type WaitType = 'none' | 'lock' | 'latch' | 'spinlock';

interface QueryState {
    id: number;
    status: 'parsing' | 'optimizing' | 'executing' | 'suspended' | 'runnable' | 'running' | 'done';
    waitType: WaitType;
    progress: number;
}

export function QueryExecution() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'execution' | 'optimizer' | 'dmvs'>('execution');
    const [queries, setQueries] = useState<QueryState[]>([]);
    const [activeWaitType, setActiveWaitType] = useState<WaitType>('none');
    const [logs, setLogs] = useState<string[]>(['System idle...']);
    const [isTsqlOpen, setIsTsqlOpen] = useState(false);

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
        <div className="flex flex-col h-full gap-6">
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

                <div className="flex p-1 bg-white/5 rounded-xl w-fit glass-panel border border-white/10">
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

            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'execution' && (
                        <motion.div
                            key="execution"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full flex flex-col gap-6 overflow-y-auto pb-4"
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
                            className="h-full w-full overflow-y-auto pb-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass-panel p-6 rounded-2xl border-t-4 border-red-500 flex flex-col gap-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-red-400">
                                        <GitMerge className="w-5 h-5" /> {t('optTitle')}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">{t('optDesc')}</p>

                                    <div className="mt-4 flex flex-col gap-4 relative">
                                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-white/10" />

                                        <div className="flex gap-4 relative z-10">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-500 flex flex-shrink-0 items-center justify-center font-bold text-xs text-blue-400">1</div>
                                            <div>
                                                <h4 className="font-bold text-blue-400">{t('phaseParsing')}</h4>
                                                <p className="text-sm text-muted-foreground">{t('phaseParsingDesc')}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 relative z-10">
                                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex flex-shrink-0 items-center justify-center font-bold text-xs text-cyan-400">2</div>
                                            <div>
                                                <h4 className="font-bold text-cyan-400">{t('phaseBinding')}</h4>
                                                <p className="text-sm text-muted-foreground">{t('phaseBindingDesc')}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 relative z-10 bg-red-500/10 p-4 -ml-4 rounded-xl border border-red-500/30">
                                            <div className="w-8 h-8 rounded-full bg-red-500/20 border-2 border-red-500 flex flex-shrink-0 items-center justify-center font-bold text-xs text-red-400">3</div>
                                            <div>
                                                <h4 className="font-bold text-red-400">{t('phaseOptimization')}</h4>
                                                <p className="text-sm text-muted-foreground">{t('phaseOptimizationDesc')}</p>
                                                <div className="mt-2 text-xs font-mono text-center bg-black/40 py-2 rounded border border-white/5">
                                                    {t('costCpuIo')}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 relative z-10">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex flex-shrink-0 items-center justify-center font-bold text-xs text-emerald-400">4</div>
                                            <div>
                                                <h4 className="font-bold text-emerald-400">{t('phaseExecution')}</h4>
                                                <p className="text-sm text-muted-foreground">{t('phaseExecutionDesc')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-2xl border-t-4 border-amber-500 flex flex-col gap-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                                        <ChartBar className="w-5 h-5" /> {t('statsTitle')}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">{t('statsDesc')}</p>

                                    <div className="mt-6 p-4 bg-black/30 rounded-xl border border-white/5 relative overflow-hidden">
                                        {/* Mock Histogram */}
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
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'dmvs' && (
                        <motion.div
                            key="dmvs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full w-full overflow-y-auto pb-4"
                        >
                            <div className="max-w-4xl mx-auto glass-panel p-8 rounded-2xl border-t-4 border-cyan-500 flex flex-col gap-6">
                                <h3 className="text-2xl font-bold flex items-center gap-2 text-cyan-400">
                                    <FileSearch className="w-6 h-6" /> {t('dmvTitle')}
                                </h3>
                                <p className="text-muted-foreground">{t('dmvDesc')}</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5 hover:border-emerald-500/40 transition-colors">
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
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5 hover:border-purple-500/40 transition-colors">
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
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5 hover:border-amber-500/40 transition-colors">
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
                                <div className="mt-2">
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
                                                <pre className="p-4 text-[11px] font-mono text-white/80 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
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
