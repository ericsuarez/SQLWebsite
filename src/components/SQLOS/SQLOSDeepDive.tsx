import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Cpu, Lock, Clock, Activity, ArrowRight, Server, Repeat, SkipForward } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { SQLOS_STATES, SYNC_PRIMITIVES, WAIT_CATEGORIES } from '../../data/advancedSQLData';

export function SQLOSDeepDive() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'threads' | 'schedulers' | 'sync' | 'waits'>('threads');

    const tabs = [
        { id: 'threads', icon: Activity, labelKey: 'sqlosTabThreads', color: 'text-emerald-400' },
        { id: 'schedulers', icon: Cpu, labelKey: 'sqlosTabSchedulers', color: 'text-indigo-400' },
        { id: 'sync', icon: Lock, labelKey: 'sqlosTabSync', color: 'text-rose-400' },
        { id: 'waits', icon: Clock, labelKey: 'sqlosTabWaits', color: 'text-amber-400' }
    ] as const;

    return (
        <div className="flex flex-col h-full overflow-y-auto text-slate-200">
            {/* Header */}
            <div className="flex-none p-6 border-b border-white/10 glass-panel relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2 flex items-center gap-3">
                            <Database className="w-8 h-8 text-violet-400" />
                            {t('tabSqlOs')}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-sm">
                            {t('sqlosMainDesc')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mt-6 overflow-x-auto pb-2 custom-scrollbar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border flex-shrink-0",
                                    isActive ? "bg-white/10 text-white border-white/20 shadow-glow" : "bg-transparent text-muted-foreground border-transparent hover:bg-white/5"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? tab.color : "text-white/40")} />
                                {t(tab.labelKey)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 p-6 sm:p-8 flex flex-col items-center">
                <div className="w-full max-w-5xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* THREAD STATE MACHINE */}
                            {activeTab === 'threads' && (
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-2xl font-bold text-emerald-400">{t('sqlosThreadsTitle')}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{t('sqlosThreadsDesc')}</p>
                                    
                                    <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40 relative mt-4">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] rounded-3xl" />
                                        
                                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-8 pb-4">
                                            {/* RUNNING */}
                                            <div className="flex flex-col items-center gap-4 relative">
                                                <div className="w-32 h-32 rounded-full border-4 border-emerald-500/50 bg-emerald-500/10 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                                    <Cpu className="w-8 h-8 text-emerald-400 mb-1" />
                                                    <span className="font-bold text-emerald-400">{t('sqlosRunning')}</span>
                                                </div>
                                                <div className="text-sm text-emerald-300 max-w-[200px]">{t('sqlosRunningDesc')}</div>
                                                
                                                {/* Arrow to Suspended limit max quantum */}
                                                <div className="hidden md:block absolute top-[20%] -right-8 w-16 h-0.5 bg-gradient-to-r from-emerald-500/50 to-rose-500/50">
                                                    <ArrowRight className="w-4 h-4 text-rose-400 absolute -right-2 -top-2" />
                                                </div>
                                            </div>

                                            {/* SUSPENDED */}
                                            <div className="flex flex-col items-center gap-4 relative">
                                                <div className="w-32 h-32 rounded-full border-4 border-rose-500/50 bg-rose-500/10 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                                                    <Clock className="w-8 h-8 text-rose-400 mb-1" />
                                                    <span className="font-bold text-rose-400">{t('sqlosSuspended')}</span>
                                                </div>
                                                <div className="text-sm text-rose-300 max-w-[200px]">{t('sqlosSuspendedDesc')}</div>
                                                
                                                {/* Arrow to Runnable context signal */}
                                                <div className="hidden md:block absolute top-[20%] -right-8 w-16 h-0.5 bg-gradient-to-r from-rose-500/50 to-amber-500/50">
                                                    <ArrowRight className="w-4 h-4 text-amber-400 absolute -right-2 -top-2" />
                                                </div>
                                            </div>

                                            {/* RUNNABLE */}
                                            <div className="flex flex-col items-center gap-4 relative">
                                                <div className="w-32 h-32 rounded-full border-4 border-amber-500/50 bg-amber-500/10 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                                    <Activity className="w-8 h-8 text-amber-400 mb-1" />
                                                    <span className="font-bold text-amber-400">{t('sqlosRunnable')}</span>
                                                </div>
                                                <div className="text-sm text-amber-300 max-w-[200px]">{t('sqlosRunnableDesc')}</div>

                                                {/* Arrow back to running */}
                                                <svg className="hidden md:block absolute -top-8 -left-[140%] w-[150%] h-12" fill="none">
                                                    <path d="M 0 40 Q 150 -10 300 40" stroke="rgba(16,185,129,0.5)" strokeWidth="2" strokeDasharray="4 4" />
                                                    <polygon points="10,38 0,40 10,45" fill="rgba(16,185,129,0.8)" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SCHEDULERS */}
                            {activeTab === 'schedulers' && (
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-2xl font-bold text-indigo-400">{t('sqlosSchedulersTitle')}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{t('sqlosSchedulersDesc')}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div className="glass-panel p-6 rounded-2xl border-indigo-500/30 flex flex-col gap-4">
                                            <div className="flex items-center gap-3 text-indigo-400 mb-2">
                                                <Repeat className="w-6 h-6" />
                                                <h4 className="text-lg font-bold">{t('nonPreemptiveTitle')}</h4>
                                            </div>
                                            <p className="text-sm text-white/70">{t('nonPreemptiveDesc')}</p>
                                        </div>
                                        <div className="glass-panel p-6 rounded-2xl border-indigo-500/30 flex flex-col gap-4">
                                            <div className="flex items-center gap-3 text-indigo-400 mb-2">
                                                <SkipForward className="w-6 h-6" />
                                                <h4 className="text-lg font-bold">{t('quantumTitle')}</h4>
                                            </div>
                                            <p className="text-sm text-white/70">{t('quantumDesc')}</p>
                                        </div>
                                        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border-indigo-500/30 bg-black/40">
                                            <h4 className="font-bold text-indigo-400 mb-4">{t('schedulerAnatomy')}</h4>
                                            <div className="flex items-stretch h-20 rounded-xl overflow-hidden text-center text-xs font-bold shadow-outline">
                                                <div className="w-1/4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex flex-col justify-center gap-1">
                                                    <span>RUNNING</span>
                                                    <span className="text-[10px] text-emerald-400/50">CPU (Max 1)</span>
                                                </div>
                                                <div className="w-1/2 bg-amber-500/20 border border-amber-500/40 text-amber-400 flex flex-col justify-center gap-1">
                                                    <span>RUNNABLE QUEUE</span>
                                                    <span className="text-[10px] text-amber-400/50">FIFO Queue</span>
                                                </div>
                                                <div className="w-1/4 bg-rose-500/20 border border-rose-500/40 text-rose-400 flex flex-col justify-center gap-1">
                                                    <span>WAITER LIST</span>
                                                    <span className="text-[10px] text-rose-400/50">Suspended Event List</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SYNCHRONIZATION */}
                            {activeTab === 'sync' && (
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-2xl font-bold text-rose-400">{t('sqlosSyncTitle')}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{t('sqlosSyncDesc')}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                        {SYNC_PRIMITIVES.map(sp => (
                                            <div key={sp.id} className={cn("glass-panel p-6 rounded-2xl border-t-4 transition-all hover:scale-105", `border-\${sp.color}-500/50`)}>
                                                <h4 className={cn("text-xl font-black mb-4 uppercase tracking-widest", `text-\${sp.color}-400`)}>{t(sp.nameKey)}</h4>
                                                <div className="space-y-4 text-sm">
                                                    <div>
                                                        <span className="text-xs text-muted-foreground font-bold uppercase">{t('syncLevel')}</span>
                                                        <p className="font-medium text-white/90">{t(sp.levelKey)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-muted-foreground font-bold uppercase">{t('syncGranularity')}</span>
                                                        <p className="font-medium text-white/90">{t(sp.granularityKey)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-muted-foreground font-bold uppercase">{t('syncDuration')}</span>
                                                        <p className="font-medium text-white/90">{t(sp.durationKey)}</p>
                                                    </div>
                                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                                        <span className="text-[10px] text-fuchsia-400 font-bold uppercase mb-1 block">Example</span>
                                                        <p className="font-mono text-xs text-white/70">{t(sp.exampleKey)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* WAITS */}
                            {activeTab === 'waits' && (
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-2xl font-bold text-amber-400">{t('sqlosWaitsTitle')}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{t('sqlosWaitsDesc')}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        {WAIT_CATEGORIES.map(wc => (
                                            <div key={wc.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                                    <h4 className={cn("text-lg font-bold", `text-\${wc.color}-400`)}>{t(wc.nameKey)}</h4>
                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", `bg-\${wc.color}-500/20 text-\${wc.color}-300`)}>Category</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{t(wc.descKey)}</p>
                                                
                                                <div className="space-y-3 mt-2 flex-1 relative z-10">
                                                    {wc.waits.map((w, idx) => (
                                                        <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/5 hover:border-white/20 transition-colors group">
                                                            <div className="font-mono text-sm text-white/90 font-bold mb-1">{w.name}</div>
                                                            <div className="text-xs text-white/60 mb-2 leading-relaxed">{t(w.descKey)}</div>
                                                            <div className="text-xs bg-emerald-500/10 text-emerald-300/80 p-2 rounded flex gap-2">
                                                                <span className="font-bold text-emerald-500">Fix:</span> {t(w.fixKey)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
