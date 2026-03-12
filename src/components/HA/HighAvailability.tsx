import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Server, Database, ShieldCheck, Activity, Send, AlertTriangle, CheckCircle2, Code2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    DISASTER_RECOVERY_SCENARIOS,
    DR_GOLDEN_RULES,
    type DisasterRecoveryScenario,
    type LocalizedText,
} from '../../data/platformGuidesData';
import { TSqlModal } from '../Shared/TSqlModal';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

type CommitMode = 'synchronous' | 'asynchronous';

interface Transaction {
    id: number;
    status: 'client_sent' | 'primary_log' | 'sending_replica' | 'replica_log' | 'replica_ack' | 'primary_commit' | 'client_ack';
}

export function HighAvailability() {
    const { t, language } = useLanguage();
    const [mode, setMode] = useState<CommitMode>('synchronous');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [primaryLSN, setPrimaryLSN] = useState<number>(1000);
    const [secondaryLSN, setSecondaryLSN] = useState<number>(1000);
    const [isTsqlOpen, setIsTsqlOpen] = useState(false);
    const [activeDrScenarioId, setActiveDrScenarioId] = useState<DisasterRecoveryScenario['id']>('pitr');
    const [activeDrStepIndex, setActiveDrStepIndex] = useState(0);

    const pick = (text: LocalizedText) => language === 'es' ? text.es : text.en;

    const simulateCommit = () => {
        const newTxId = Date.now();
        setTransactions(p => [...p, { id: newTxId, status: 'client_sent' }]);

        const runSyncFlow = () => {
            const nextLsn = primaryLSN + 15;

            // 1. Primary writes to Log
            setTimeout(() => {
                setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'primary_log' } : t));
                setPrimaryLSN(nextLsn);
            }, 500);

            // 2. primary sends to Replica
            setTimeout(() => setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'sending_replica' } : t)), 1000);

            // 3. Replica writes to Log (Harden)
            setTimeout(() => {
                setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'replica_log' } : t));
                setSecondaryLSN(nextLsn);
            }, 1800);

            // 4. Replica ACKs
            setTimeout(() => setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'replica_ack' } : t)), 2300);

            // 5. Primary Commits
            setTimeout(() => setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'primary_commit' } : t)), 2800);

            // 6. Client Ack
            setTimeout(() => {
                setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'client_ack' } : t));
                setTimeout(() => setTransactions(p => p.filter(t => t.id !== newTxId)), 2000); // clear after 2s
            }, 3200);
        };

        const runAsyncFlow = () => {
            const nextLsn = primaryLSN + 15;

            // 1. Primary writes to Log
            setTimeout(() => {
                setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'primary_log' } : t));
                setPrimaryLSN(nextLsn);
            }, 500);

            // 2. Primary Commits AND Sends to replica simultaneously (Async rule)
            setTimeout(() => setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'primary_commit' } : t)), 1000);

            // 3. Client Ack (Fast!)
            setTimeout(() => setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'client_ack' } : t)), 1300);

            // Background replication...
            setTimeout(() => setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'sending_replica' } : t)), 1600);
            setTimeout(() => {
                setTransactions(p => p.map(t => t.id === newTxId ? { ...t, status: 'replica_log' } : t));
                setSecondaryLSN(nextLsn);
            }, 3000); // Intentionally delayed to show LSN lag

            setTimeout(() => {
                setTransactions(p => p.filter(t => t.id !== newTxId));
            }, 4000);
        };

        if (mode === 'synchronous') runSyncFlow();
        else runAsyncFlow();
    };

    const lsnLagging = primaryLSN > secondaryLSN;
    const activeDrScenario =
        DISASTER_RECOVERY_SCENARIOS.find((scenario) => scenario.id === activeDrScenarioId) ??
        DISASTER_RECOVERY_SCENARIOS[0];
    const activeDrStep = activeDrScenario.steps[activeDrStepIndex] ?? activeDrScenario.steps[0];

    return (
        <div className="flex min-h-full flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    {t('haTitle')}
                </h2>
                <p className="text-muted-foreground">
                    {t('haDesc')}
                </p>
            </div>

            <div className="glass-panel relative min-h-0 flex-1 overflow-y-auto rounded-2xl p-4 sm:p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

                {/* Controls */}
                <div className="z-10 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setMode('synchronous')}
                            className={cn("px-4 py-2 rounded-lg font-bold transition-all border", mode === 'synchronous' ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" : "bg-black/40 border-white/10 text-muted-foreground")}
                        >
                            {t('syncCommit')}
                        </button>
                        <button
                            onClick={() => setMode('asynchronous')}
                            className={cn("px-4 py-2 rounded-lg font-bold transition-all border", mode === 'asynchronous' ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-black/40 border-white/10 text-muted-foreground")}
                        >
                            {t('asyncCommit')}
                        </button>
                    </div>
                    <button
                        onClick={simulateCommit}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-6 py-2 font-bold text-emerald-400 transition-colors disabled:opacity-50 hover:bg-emerald-500/30 lg:w-auto"
                        disabled={transactions.length > 0}
                    >
                        <Send className="w-4 h-4" /> {t('execTx')}
                    </button>
                </div>

                {/* Dashboard Stats */}
                <div className="z-10 grid gap-4 rounded-xl border border-white/10 bg-black/40 p-4 sm:grid-cols-3 sm:items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t('primaryLsnLabel')}</span>
                        <span className="font-mono text-cyan-400 text-xl font-bold">0x{primaryLSN.toString(16).toUpperCase()}</span>
                    </div>
                    <div className="hidden h-8 w-px bg-white/10 sm:block" />
                    <div className="flex min-w-0 flex-col items-center">
                        {lsnLagging ? (
                            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30">
                                <AlertTriangle className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-bold uppercase tracking-wider">{t('lsnLag')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-bold uppercase tracking-wider">{t('syncMatched')}</span>
                            </div>
                        )}
                    </div>
                    <div className="hidden h-8 w-px bg-white/10 sm:block" />
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t('replicaLsnLabel')}</span>
                        <span className="font-mono text-blue-400 text-xl font-bold">0x{secondaryLSN.toString(16).toUpperCase()}</span>
                    </div>
                </div>

                {/* Replica Diagram */}
                <div className="flex-1 flex flex-col justify-center gap-12 z-10">

                    <div className="grid items-center gap-6 lg:grid-cols-3 lg:gap-8">

                        {/* Application Client */}
                        <div className="glass-panel p-6 border-white/20 text-center relative flex flex-col items-center gap-4">
                            <h3 className="font-bold text-white mb-2">{t('appClient')}</h3>
                            <Activity className="w-12 h-12 text-white/50" />
                            <div className="text-sm text-muted-foreground bg-black/40 px-3 py-1.5 rounded w-full">
                                {transactions[0]?.status === 'client_ack' ? (
                                    <span className="text-emerald-400 font-bold">{t('txCommitted')}</span>
                                ) : transactions.length > 0 ? (
                                    <span className="text-amber-400 animate-pulse">{t('waitingDb')}</span>
                                ) : t('idle')}
                            </div>
                        </div>

                        {/* Primary Replica */}
                        <div className="glass-panel border-cyan-500/50 p-6 relative flex flex-col items-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] block">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                                {t('primaryRole')}
                            </div>
                            <Server className="w-16 h-16 text-cyan-400 mt-4" />
                            <h3 className="font-bold text-lg">{t('nodeA')}</h3>

                            <div className="w-full bg-black/40 p-3 rounded text-sm border border-white/10 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-xs">{t('txLog')}</span>
                                </div>
                                <div className="h-8 bg-white/5 rounded border border-white/10 flex items-center justify-center relative overflow-hidden">
                                    {(transactions[0]?.status === 'primary_log' || transactions[0]?.status === 'sending_replica' || transactions[0]?.status === 'replica_log' || transactions[0]?.status === 'replica_ack' || transactions[0]?.status === 'primary_commit') && (
                                        <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="absolute left-0 top-0 bottom-0 bg-blue-500/50" />
                                    )}
                                    <span className="relative z-10 text-xs font-mono">{transactions.length > 0 ? `${t('logBlock')} 0x${(primaryLSN).toString(16).toUpperCase()}` : t('emptyLsn')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Replica */}
                        <div className="glass-panel border-blue-500/30 p-6 relative flex flex-col items-center gap-4 shadow-lg opacity-90">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500/50 text-white border border-blue-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                                {t('secondaryRole')}
                            </div>
                            <Database className="w-16 h-16 text-blue-400 mt-4" />
                            <h3 className="font-bold text-lg">{t('nodeB')}</h3>

                            <div className="w-full bg-black/40 p-3 rounded text-sm border border-white/10 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-xs">{t('txLog')}</span>
                                </div>
                                <div className="h-8 bg-white/5 rounded border border-white/10 flex items-center justify-center relative overflow-hidden">
                                    {(transactions[0]?.status === 'replica_log' || transactions[0]?.status === 'replica_ack') && (
                                        <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="absolute left-0 top-0 bottom-0 bg-cyan-500/50" />
                                    )}
                                    <span className="relative z-10 text-xs font-mono">
                                        {transactions[0]?.status === 'replica_log' || transactions[0]?.status === 'replica_ack' || transactions.length === 0 ? `${t('hardenLsn')} 0x${(secondaryLSN).toString(16).toUpperCase()}` : t('awaiting')}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
                        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="hidden flex-1 sm:block" />
                            <h4 className="font-bold text-lg flex items-center justify-center gap-2">
                                <ShieldCheck className="w-5 h-5" /> {t('explanation')}
                            </h4>
                            <div className="flex justify-center sm:flex-1 sm:justify-end">
                                <button
                                    onClick={() => setIsTsqlOpen(true)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
                                >
                                    <Code2 className="w-3.5 h-3.5" /> {t('viewTsql')}
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-balance text-muted-foreground mx-auto">
                            {mode === 'synchronous' ? t('syncExplanation') : t('asyncExplanation')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_380px]">
                <div className="glass-panel rounded-3xl p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-4xl">
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                                {language === 'es' ? 'Runbook de disaster recovery' : 'Disaster recovery runbook'}
                            </p>
                            <h3 className="mt-2 text-2xl font-bold text-white">
                                {pick(activeDrScenario.headline)}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-white/70">
                                {pick(activeDrScenario.summary)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeDrScenario.badges.map((badge) => (
                                <span
                                    key={badge}
                                    className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-300"
                                >
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                        {DISASTER_RECOVERY_SCENARIOS.map((scenario) => {
                            const isActive = scenario.id === activeDrScenario.id;

                            return (
                                <button
                                    key={scenario.id}
                                    onClick={() => {
                                        setActiveDrScenarioId(scenario.id);
                                        setActiveDrStepIndex(0);
                                    }}
                                    className={cn(
                                        'rounded-3xl border p-4 text-left transition-all',
                                        isActive
                                            ? 'border-cyan-500/25 bg-cyan-500/10 shadow-[0_0_22px_rgba(34,211,238,0.14)]'
                                            : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                                    )}
                                >
                                    <div className="text-sm font-semibold text-white">{pick(scenario.title)}</div>
                                    <div className="mt-2 text-xs leading-6 text-white/60">
                                        {pick(scenario.preferredPath)}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative mt-8">
                        <div className="absolute left-0 right-0 top-5 h-px bg-white/10" />
                        <motion.div
                            className="absolute left-0 top-5 h-px bg-gradient-to-r from-cyan-400 to-blue-400"
                            animate={{ width: `${((activeDrStepIndex + 1) / activeDrScenario.steps.length) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 110, damping: 18 }}
                        />
                        <div className="grid gap-3 md:grid-cols-5">
                            {activeDrScenario.steps.map((step, index) => {
                                const isActive = index === activeDrStepIndex;

                                return (
                                    <button
                                        key={`${activeDrScenario.id}-${step.id}`}
                                        onClick={() => setActiveDrStepIndex(index)}
                                        className={cn(
                                            'relative rounded-3xl border p-4 pt-7 text-left transition-all',
                                            isActive
                                                ? 'border-cyan-500/25 bg-cyan-500/10'
                                                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                                        )}
                                    >
                                        <div className="absolute left-4 top-3 h-4 w-4 rounded-full border border-white/20 bg-black/80">
                                            {isActive && <div className="m-[3px] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.85)]" />}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                                            {language === 'es' ? `Paso ${index + 1}` : `Step ${index + 1}`}
                                        </div>
                                        <div className="mt-2 text-sm font-semibold leading-6 text-white">
                                            {pick(step.title)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${activeDrScenario.id}-${activeDrStep.id}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                className="rounded-3xl border border-white/10 bg-black/20 p-5"
                            >
                                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                                    {language === 'es' ? 'Paso activo' : 'Active step'}
                                </div>
                                <h4 className="mt-3 text-xl font-bold text-white">
                                    {language === 'es' ? `Paso ${activeDrStepIndex + 1}. ` : `Step ${activeDrStepIndex + 1}. `}
                                    {pick(activeDrStep.title)}
                                </h4>
                                <p className="mt-4 text-sm leading-7 text-white/80">
                                    {pick(activeDrStep.detail)}
                                </p>
                                <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-white/80">
                                    {pick(activeDrStep.hint)}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                                    {language === 'es' ? 'Primer movimiento' : 'First move'}
                                </div>
                                <p className="mt-3 text-sm leading-7 text-white/80">
                                    {pick(activeDrScenario.firstMove)}
                                </p>
                            </div>
                            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">
                                    <AlertTriangle className="h-4 w-4" />
                                    {language === 'es' ? 'Trampa clásica' : 'Classic trap'}
                                </div>
                                <p className="mt-3 text-sm leading-7 text-white/80">
                                    {pick(activeDrScenario.trap)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                                {language === 'es' ? 'Inventario y diagnóstico' : 'Inventory and diagnostics'}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-white/65">
                                {language === 'es'
                                    ? 'Antes de restaurar, confirma backups, estado y evidencia técnica.'
                                    : 'Before restoring, confirm backups, state and technical evidence.'}
                            </p>
                            <CopyCodeBlock code={activeDrScenario.diagnosticScript} accent="blue" className="mt-4" />
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                                {language === 'es' ? 'Acción principal' : 'Primary action'}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-white/65">
                                {pick(activeDrScenario.preferredPath)}
                            </p>
                            <CopyCodeBlock code={activeDrScenario.recoveryScript} accent="amber" className="mt-4" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel rounded-3xl p-5">
                        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                            {language === 'es' ? 'Marco de decisión' : 'Decision frame'}
                        </div>
                        <div className="mt-4 grid gap-3">
                            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">RPO</div>
                                <div className="mt-2 text-xl font-bold text-white">{activeDrScenario.rpo}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">RTO</div>
                                <div className="mt-2 text-xl font-bold text-white">{activeDrScenario.rto}</div>
                            </div>
                            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                                    {language === 'es' ? 'Camino recomendado' : 'Preferred path'}
                                </div>
                                <div className="mt-2 text-sm leading-6 text-white/85">
                                    {pick(activeDrScenario.preferredPath)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel rounded-3xl p-5">
                        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                            {language === 'es' ? 'Reglas de oro' : 'Golden rules'}
                        </div>
                        <div className="mt-4 space-y-3">
                            {DR_GOLDEN_RULES.map((rule, index) => (
                                <div
                                    key={`dr-rule-${index}`}
                                    className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/75"
                                >
                                    {pick(rule)}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel rounded-3xl p-5">
                        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                            {language === 'es' ? 'Validación post-recuperación' : 'Post-recovery validation'}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/65">
                            {language === 'es'
                                ? 'Comprueba consistencia, estado operativo y la evidencia mínima antes de reabrir tráfico.'
                                : 'Check consistency, operating state and minimum evidence before reopening traffic.'}
                        </p>
                        <CopyCodeBlock code={activeDrScenario.validationScript} accent="emerald" className="mt-4" />
                    </div>
                </div>
            </div>

            <TSqlModal
                isOpen={isTsqlOpen}
                onClose={() => setIsTsqlOpen(false)}
                title={t('haTsqlTitle')}
                description={t('haTsqlDesc')}
                diagnosticScript={{
                    '2019': `SELECT ar.replica_server_name, rs.synchronization_state_desc,\n       rs.last_hardened_lsn, rs.end_of_log_lsn, rs.log_send_queue_size\nFROM sys.dm_hadr_database_replica_states rs\nJOIN sys.availability_replicas ar ON rs.replica_id = ar.replica_id;`,
                    '2022': `SELECT ar.replica_server_name, rs.synchronization_state_desc,\n       rs.last_hardened_lsn, rs.end_of_log_lsn, rs.log_send_queue_size\nFROM sys.dm_hadr_database_replica_states rs\nJOIN sys.availability_replicas ar ON rs.replica_id = ar.replica_id;`,
                    '2025': `SELECT ar.replica_server_name, rs.synchronization_state_desc,\n       rs.last_hardened_lsn, rs.end_of_log_lsn, rs.log_send_queue_size\nFROM sys.dm_hadr_database_replica_states rs\nJOIN sys.availability_replicas ar ON rs.replica_id = ar.replica_id;`
                }}
                remediationTitle={t('haRemediationTitle')}
                remediationScript={{
                    '2019': `-- Switch from Asynchronous to Synchronous Commit to prevent data loss (Increases Latency)\nALTER AVAILABILITY GROUP [YourAGName]\nMODIFY REPLICA ON 'SecondaryNode' WITH (AVAILABILITY_MODE = SYNCHRONOUS_COMMIT);`,
                    '2022': `-- Switch from Asynchronous to Synchronous Commit to prevent data loss (Increases Latency)\nALTER AVAILABILITY GROUP [YourAGName]\nMODIFY REPLICA ON 'SecondaryNode' WITH (AVAILABILITY_MODE = SYNCHRONOUS_COMMIT);`,
                    '2025': `-- Switch from Asynchronous to Synchronous Commit to prevent data loss (Increases Latency)\nALTER AVAILABILITY GROUP [YourAGName]\nMODIFY REPLICA ON 'SecondaryNode' WITH (AVAILABILITY_MODE = SYNCHRONOUS_COMMIT);`
                }}
            />
        </div>
    );
}
