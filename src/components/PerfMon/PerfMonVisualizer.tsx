import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Cpu, HardDrive, Database, AlertCircle, Play, Square, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { PERFMON_COUNTERS } from '../../data/advancedSQLData';

export function PerfMonVisualizer() {
    const { t } = useLanguage();
    const [isStressing, setIsStressing] = useState(false);
    const [liveData, setLiveData] = useState<Record<string, number>>({});
    const animationRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(Date.now());

    // Initialize with default values
    useEffect(() => {
        const initial: Record<string, number> = {};
        PERFMON_COUNTERS.forEach(c => {
            initial[c.id] = c.defaultValue;
        });
        setLiveData(initial);
    }, []);

    // Simulation loop
    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            if (now - lastTickRef.current > 500) { // Update every 500ms
                setLiveData(prev => {
                    const next = { ...prev };
                    PERFMON_COUNTERS.forEach(c => {
                        const target = isStressing ? c.stressValue : c.defaultValue;
                        const variance = (c.stressValue - c.defaultValue) * 0.1; // 10% variance noise
                        const noise = (Math.random() * variance * 2) - variance;
                        
                        // Move 20% closer to target each tick + noise
                        let current = next[c.id] || c.defaultValue;
                        current = current + (target - current) * 0.2 + noise;
                        
                        // Special bounds (don't let PLE go negative, etc)
                        if (current < 0) current = 0;
                        
                        next[c.id] = Math.round(current);
                    });
                    return next;
                });
                lastTickRef.current = now;
            }
            animationRef.current = requestAnimationFrame(tick);
        };
        animationRef.current = requestAnimationFrame(tick);
        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isStressing]);

    const getHealthColor = (val: number, counter: typeof PERFMON_COUNTERS[0]) => {
        if (counter.direction === 'higher-is-better') {
            if (val <= counter.critical) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
            if (val <= counter.warning) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        } else {
            if (val >= counter.critical) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
            if (val >= counter.warning) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        }
    };

    const getProgressPct = (val: number, counter: typeof PERFMON_COUNTERS[0]) => {
        // Normalize the value to a 0-100% scale for the visual gauge relative to healthy vs critical
        const min = counter.direction === 'higher-is-better' ? 0 : counter.healthy * 0.5;
        const max = counter.direction === 'higher-is-better' ? counter.healthy * 1.5 : counter.critical * 1.5;
        let pct = ((val - min) / (max - min)) * 100;
        return Math.max(0, Math.min(100, pct));
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto text-slate-200">
            {/* Header */}
            <div className="flex-none p-6 border-b border-white/10 glass-panel relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-pink-400 mb-2 flex items-center gap-3">
                            <Gauge className="w-8 h-8 text-fuchsia-400" />
                            {t('tabPerfMon')}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-sm">
                            {t('pmMainDesc')}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsStressing(!isStressing)}
                        className={cn(
                            "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-glow",
                            isStressing 
                                ? "bg-rose-500 text-white hover:bg-rose-600" 
                                : "bg-fuchsia-500 text-white hover:bg-fuchsia-600"
                        )}
                    >
                        {isStressing ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        {isStressing ? t('pmStopStress') : t('pmStartStress')}
                    </button>
                </div>
            </div>

            <div className="p-6 sm:p-8 flex flex-col gap-10">
                {/* Categories */}
                {(['memory', 'io', 'cpu'] as const).map(cat => {
                    const icon = cat === 'memory' ? <Database className="w-6 h-6 text-indigo-400" /> : 
                                 cat === 'io' ? <HardDrive className="w-6 h-6 text-emerald-400" /> : 
                                 <Cpu className="w-6 h-6 text-amber-400" />;
                    const catTitle = cat === 'memory' ? t('pmCatMemory') : cat === 'io' ? t('pmCatIo') : t('pmCatCpu');
                    
                    return (
                        <div key={cat} className="flex flex-col gap-4">
                            <h3 className="text-2xl font-bold flex items-center gap-3 border-b border-white/10 pb-2">
                                {icon} {catTitle}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {PERFMON_COUNTERS.filter(c => c.category === cat).map(counter => {
                                    const val = liveData[counter.id] || 0;
                                    const healthClass = getHealthColor(val, counter);
                                    const pct = getProgressPct(val, counter);
                                    const isCritical = healthClass.includes('rose');

                                    return (
                                        <div key={counter.id} className={cn(
                                            "glass-panel rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group",
                                            healthClass.replace('text-', 'border-').split(' ')[2], // Extract border color
                                            isCritical ? "shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse-slow" : ""
                                        )}>
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-bold text-sm text-white/90 group-hover:text-white transition-colors flex items-center gap-2">
                                                    {isCritical && <AlertCircle className="w-4 h-4 text-rose-400" />}
                                                    {t(counter.nameKey)}
                                                </h4>
                                            </div>
                                            
                                            <div className="flex items-baseline gap-1 mb-6">
                                                <span className={cn("text-4xl font-black font-mono tracking-tighter", healthClass.split(' ')[0])}>
                                                    {val.toLocaleString()}
                                                </span>
                                                <span className="text-sm font-medium text-white/50">{counter.unit}</span>
                                            </div>

                                            {/* Progress Gauge */}
                                            <div className="h-2 bg-black/40 rounded-full overflow-hidden mb-4">
                                                <motion.div 
                                                    className={cn("h-full", healthClass.split(' ')[1].replace('/10', ''))} 
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                                />
                                            </div>

                                            {/* Thresholds Info */}
                                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold border-t border-white/5 pt-3">
                                                <span className="flex flex-col gap-0.5" title="Healthy threshold">
                                                    <span className="text-emerald-400/80">OK</span>
                                                    <span>{counter.direction === 'higher-is-better' ? '≥' : '≤'} {counter.healthy.toLocaleString()}</span>
                                                </span>
                                                <span className="flex flex-col gap-0.5 items-end" title="Critical threshold">
                                                    <span className="text-rose-400/80">CRIT</span>
                                                    <span>{counter.direction === 'higher-is-better' ? '≤' : '≥'} {counter.critical.toLocaleString()}</span>
                                                </span>
                                            </div>

                                            {/* Tooltip Description Overlay */}
                                            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm p-5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center text-sm border-t-2 border-fuchsia-500/50">
                                                <div className="flex items-center gap-2 text-fuchsia-400 mb-2 font-bold">
                                                    <Info className="w-4 h-4" /> Explanation
                                                </div>
                                                <p className="text-white/80 leading-relaxed text-xs">
                                                    {t(counter.descKey)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
