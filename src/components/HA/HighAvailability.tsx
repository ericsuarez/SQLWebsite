import { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, ShieldCheck, Activity, Send, AlertTriangle, CheckCircle2, Code2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';

type CommitMode = 'synchronous' | 'asynchronous';

interface Transaction {
    id: number;
    status: 'client_sent' | 'primary_log' | 'sending_replica' | 'replica_log' | 'replica_ack' | 'primary_commit' | 'client_ack';
}

export function HighAvailability() {
    const { t } = useLanguage();
    const [mode, setMode] = useState<CommitMode>('synchronous');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [primaryLSN, setPrimaryLSN] = useState<number>(1000);
    const [secondaryLSN, setSecondaryLSN] = useState<number>(1000);

    const [isTsqlOpen, setIsTsqlOpen] = useState(false);

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

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    {t('haTitle')}
                </h2>
                <p className="text-muted-foreground">
                    {t('haDesc')}
                </p>
            </div>

            <div className="flex-1 glass-panel p-8 rounded-2xl flex flex-col gap-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

                {/* Controls */}
                <div className="flex justify-between items-center z-10 border-b border-white/10 pb-6">
                    <div className="flex gap-4">
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
                        className="px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        disabled={transactions.length > 0}
                    >
                        <Send className="w-4 h-4" /> {t('execTx')}
                    </button>
                </div>

                {/* Dashboard Stats */}
                <div className="z-10 bg-black/40 border border-white/10 rounded-xl p-4 flex justify-around items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t('primaryLsnLabel')}</span>
                        <span className="font-mono text-cyan-400 text-xl font-bold">0x{primaryLSN.toString(16).toUpperCase()}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-center min-w-[200px]">
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
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t('replicaLsnLabel')}</span>
                        <span className="font-mono text-blue-400 text-xl font-bold">0x{secondaryLSN.toString(16).toUpperCase()}</span>
                    </div>
                </div>

                {/* Replica Diagram */}
                <div className="flex-1 flex flex-col justify-center gap-12 z-10">

                    <div className="grid grid-cols-3 gap-8 items-center">

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

                    <div className="text-center bg-black/40 p-4 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex-1" />
                            <h4 className="font-bold text-lg flex items-center justify-center gap-2">
                                <ShieldCheck className="w-5 h-5" /> {t('explanation')}
                            </h4>
                            <div className="flex-1 flex justify-end">
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
