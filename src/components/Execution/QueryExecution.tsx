import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Lock, ShieldAlert, Cpu, Database, Activity, Code2 } from 'lucide-react';
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
    const { t } = useLanguage();
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
                    // Spinlocks are busy waits - thread stays RUNNING
                    setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'running', progress: 50 } : q));
                    addLog(`Q${newId.toString().slice(-4)}: Plan created. WARNING: Hit ${waitScenario.toUpperCase()} WAIT. Thread is BURNiNG CPU (${t('statusRunning')}).`);

                    setTimeout(() => {
                        setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'done', progress: 100 } : q));
                        addLog(`Q${newId.toString().slice(-4)}: Execution COMPLETE.`);
                        setActiveWaitType('none');
                    }, 2000);
                } else {
                    // Latches and Locks yield the CPU - Thread goes to SUSPENDED
                    setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'suspended', progress: 50 } : q));
                    addLog(`Q${newId.toString().slice(-4)}: Plan created. WARNING: Hit ${waitScenario.toUpperCase()} WAIT. Thread yielded CPU (${t('statusSuspended')}).`);

                    // Resolve wait after 2.5 seconds -> move to RUNNABLE
                    setTimeout(() => {
                        setQueries(p => p.map(q => q.id === newId ? { ...q, status: 'runnable', progress: 65 } : q));
                        addLog(`Q${newId.toString().slice(-4)}: ${waitScenario.toUpperCase()} wait resolved. Moved to ${t('statusRunnable')} queue.`);
                        setActiveWaitType('none');

                        // Finally get CPU again -> RUNNING -> DONE
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
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-red-400">
                    {t('qeTitle')}
                </h2>
                <p className="text-muted-foreground">
                    {t('qeDescription')}
                </p>
            </div>

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
