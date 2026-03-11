import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Network, Shield, Cpu, Info, CheckCircle2, AlertTriangle, HardDrive, Layers, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { OS_CONFIG_ITEMS } from '../../data/advancedSQLData';

const ICONS: Record<string, any> = {
    HardDrive,
    Server,
    Layers,
    Zap,
    Network,
    Shield,
    Cpu
};

type CategoryInfo = {
    id: 'virtualization' | 'network' | 'policy' | 'power';
    icon: any;
    labelKey: string;
    color: string;
};

const CATEGORIES: CategoryInfo[] = [
    { id: 'virtualization', icon: Server, labelKey: 'catVirtualization', color: 'text-blue-400' },
    { id: 'network', icon: Network, labelKey: 'catNetwork', color: 'text-emerald-400' },
    { id: 'policy', icon: Shield, labelKey: 'catPolicy', color: 'text-rose-400' },
    { id: 'power', icon: Cpu, labelKey: 'catPower', color: 'text-amber-400' }
];

export function OSLevelConfig() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'virtualization' | 'network' | 'policy' | 'power'>('virtualization');

    const activeItems = OS_CONFIG_ITEMS.filter(item => item.category === activeTab);

    return (
        <div className="flex flex-col h-full overflow-hidden text-slate-200">
            {/* Header */}
            <div className="flex-none p-6 border-b border-white/10 glass-panel relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
                            {t('tabOsConfig')}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-sm">
                            {t('osConfigMainDesc')}
                        </p>
                    </div>
                    <Server className="w-12 h-12 text-indigo-500/30" />
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-black/20">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-4 space-y-2 overflow-y-auto glass-panel">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isActive = activeTab === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left relative overflow-hidden",
                                    isActive ? "bg-white/10 text-white border border-white/20 shadow-glow" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {isActive && <motion.div layoutId="os-active-tab" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                                <Icon className={cn("w-5 h-5", isActive ? cat.color : "text-white/40")} />
                                {t(cat.labelKey)}
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 sm:p-8 overflow-y-auto relative perspective-1000">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-6 max-w-5xl mx-auto"
                        >
                            {activeItems.map((item, idx) => {
                                const ItemIcon = ICONS[item.icon] || Info;
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                            {/* Left Column: Info */}
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold flex items-center gap-2 text-white mb-2">
                                                    <ItemIcon className="w-5 h-5 text-indigo-400" />
                                                    {t(item.titleKey)}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                                    {t(item.descKey)}
                                                </p>
                                                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex gap-3 text-sm">
                                                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                                                    <div>
                                                        <strong className="text-rose-400 block mb-1">{t('impactWhenMisconfigured')}</strong>
                                                        <span className="text-rose-300/80">{t(item.impactKey)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Comparison */}
                                            <div className="w-full md:w-72 flex flex-col gap-3">
                                                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-1 items-center justify-center text-center">
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default / Typical</span>
                                                    <span className="text-xl font-mono text-white/50">{item.defaultValue.toString()}{item.unit ? ` ${item.unit}` : ''}</span>
                                                    {item.dangerZone && <span className="text-[10px] text-rose-400 mt-1">Danger Zone: {item.dangerZone}</span>}
                                                </div>

                                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-1 items-center justify-center text-center shadow-glow">
                                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Best Practice
                                                    </span>
                                                    <span className="text-xl font-bold font-mono text-emerald-300">{item.recommendedValue.toString()}{item.unit ? ` ${item.unit}` : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
