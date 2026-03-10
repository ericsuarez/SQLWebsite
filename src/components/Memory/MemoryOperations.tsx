import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Zap, Cpu, Archive, LayoutDashboard, SearchCode, Code2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';

interface Page {
    id: number;
    state: 'clean' | 'dirty' | 'free';
    data: string;
}

export function MemoryOperations() {
    const { t } = useLanguage();
    const [bufferPool, setBufferPool] = useState<Page[]>(
        Array.from({ length: 16 }).map((_, i) => ({
            id: i,
            state: 'free',
            data: ''
        }))
    );

    const [logs, setLogs] = useState<string[]>(['SQLOS Memory Manager Initialized.']);
    const [isTsqlOpen, setIsTsqlOpen] = useState(false);

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
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    {t('memTitle')}
                </h2>
                <p className="text-muted-foreground">
                    {t('memDescription')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

                {/* Memory Map Diagram */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 z-10">
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

                        {/* Other Memory Clerks */}
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

            <TSqlModal
                isOpen={isTsqlOpen}
                onClose={() => setIsTsqlOpen(false)}
                title={t('memTsqlTitle')}
                description={t('memTsqlDesc')}
                diagnosticScript={{
                    '2019': `SELECT type, name, pages_kb\nFROM sys.dm_os_memory_clerks\nWHERE type = 'MEMORYCLERK_SQLBUFFERPOOL'\nORDER BY pages_kb DESC;`,
                    '2022': `SELECT type, name, pages_kb\nFROM sys.dm_os_memory_clerks\nWHERE type = 'MEMORYCLERK_SQLBUFFERPOOL'\nORDER BY pages_kb DESC;`,
                    '2025': `SELECT type, name, pages_kb\nFROM sys.dm_os_memory_clerks\nWHERE type = 'MEMORYCLERK_SQLBUFFERPOOL'\nORDER BY pages_kb DESC;`
                }}
                remediationTitle={t('memRemediationTitle')}
                remediationScript={{
                    '2019': `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192; -- Set to appropriate value\nRECONFIGURE;`,
                    '2022': `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192; -- Set to appropriate value\nRECONFIGURE;`,
                    '2025': `EXEC sp_configure 'show advanced options', 1;\nRECONFIGURE;\nEXEC sp_configure 'max server memory (MB)', 8192; -- Set to appropriate value\nRECONFIGURE;`
                }}
            />
        </div>
    );
}
