import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Cpu, HardDrive, MonitorIcon, ChevronRight, Play, Server, FileText, LayoutTemplate, Settings, Box, DatabaseBackup, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';
import { cn } from '../../lib/utils';

const layers: { id: string; titleKey: TranslationKey; icon: any; color: string; bg: string }[] = [
    { id: 'client', titleKey: 'layerClient', icon: MonitorIcon, color: 'border-blue-500/50', bg: 'bg-blue-500/10' },
    { id: 'os', titleKey: 'layerOS', icon: Cpu, color: 'border-purple-500/50', bg: 'bg-purple-500/10' },
    { id: 'engine', titleKey: 'layerEngine', icon: Database, color: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
    { id: 'storage', titleKey: 'layerStorage', icon: HardDrive, color: 'border-amber-500/50', bg: 'bg-amber-500/10' },
];

export function ArchitectureOverview() {
    const [activeTab, setActiveTab] = useState<'engine' | 'sysdbs' | 'files'>('engine');
    const [activeLayer, setActiveLayer] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const { t } = useLanguage();

    const simulateFlow = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setActiveLayer('client');

        setTimeout(() => setActiveLayer('os'), 1500);
        setTimeout(() => setActiveLayer('engine'), 3000);
        setTimeout(() => setActiveLayer('storage'), 4500);

        setTimeout(() => {
            setIsSimulating(false);
        }, 6000);
    };

    return (
        <div className="flex flex-col h-full gap-6 relative">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            {t('archTitle')}
                        </h2>
                        <p className="text-muted-foreground mt-2 max-w-2xl">
                            {t('archDescription')}
                        </p>
                    </div>
                </div>

                <div className="flex p-1 bg-white/5 rounded-xl w-fit glass-panel border border-white/10">
                    <button
                        onClick={() => setActiveTab('engine')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'engine' ? "bg-primary text-primary-foreground shadow-glowBlue" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Server className="w-4 h-4" />
                        {t('archTitle')}
                    </button>
                    <button
                        onClick={() => setActiveTab('sysdbs')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'sysdbs' ? "bg-amber-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <DatabaseBackup className="w-4 h-4" />
                        {t('sysDbsTitle')}
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'files' ? "bg-emerald-500 text-white shadow-glow" : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Save className="w-4 h-4" />
                        {t('dbFilesTitle')}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'engine' && (
                        <motion.div
                            key="engine"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full flex flex-col"
                        >
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={simulateFlow}
                                    disabled={isSimulating}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/50 font-bold transition-all disabled:opacity-50"
                                >
                                    <Play className="w-4 h-4" /> {t('simulateFlow')}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                                {/* Interactive Diagram */}
                                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                    {layers.map((layer, index) => {
                                        const Icon = layer.icon;
                                        const isActive = activeLayer === layer.id;
                                        return (
                                            <React.Fragment key={layer.id}>
                                                <motion.div
                                                    onClick={() => setActiveLayer(layer.id)}
                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`w-full max-w-md p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 relative z-10 ${isActive ? `${layer.bg} ${layer.color} shadow-glow` : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-lg bg-black/20">
                                                            <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-white/80'}`}>
                                                                {t(layer.titleKey)}
                                                            </h3>
                                                        </div>
                                                        {isActive && (
                                                            <motion.div layoutId="activeIndicator" className="w-2 h-2 rounded-full bg-white shadow-glow" />
                                                        )}
                                                    </div>
                                                </motion.div>

                                                {/* Arrow between layers */}
                                                {index < layers.length - 1 && (
                                                    <div className="flex flex-col items-center justify-center h-8 z-0 opacity-50">
                                                        <div className="w-0.5 h-full bg-gradient-to-b from-white/30 to-transparent" />
                                                        <ChevronRight className="w-4 h-4 text-white/50 rotate-90 -mt-2" />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>

                                {/* Details Panel */}
                                <div className="glass-panel p-8 rounded-2xl flex flex-col items-start justify-start relative">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

                                    {activeLayer ? (
                                        <motion.div
                                            key={activeLayer}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-6 w-full"
                                        >
                                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                                {t(layers.find(l => l.id === activeLayer)?.titleKey as TranslationKey)}
                                            </h3>

                                            <div className="prose prose-invert prose-sm max-w-none">
                                                {activeLayer === 'client' && (
                                                    <>
                                                        <p>{t('clientDesc1')}</p>
                                                        <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                                            <li>{t('clientDesc2')}</li>
                                                            <li>{t('clientDesc3')}</li>
                                                        </ul>
                                                    </>
                                                )}
                                                {activeLayer === 'os' && (
                                                    <>
                                                        <p>{t('osDesc1')}</p>
                                                        <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                                            <li>{t('osDesc2')}</li>
                                                            <li>{t('osDesc3')}</li>
                                                            <li>{t('osDesc4')}</li>
                                                        </ul>
                                                    </>
                                                )}
                                                {activeLayer === 'engine' && (
                                                    <>
                                                        <p>{t('engineDesc1')}</p>
                                                        <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                                            <li><strong>Parser:</strong> {t('engineDesc2').replace('Parser: ', '').replace('Analizador: ', '')}</li>
                                                            <li><strong>Algebrizer:</strong> {t('engineDesc3').replace('Algebrizer: ', '')}</li>
                                                            <li><strong>Optimizer:</strong> {t('engineDesc4').replace('Optimizer: ', '').replace('Optimizador: ', '')}</li>
                                                            <li><strong>Query Executor:</strong> {t('engineDesc5').replace('Query Executor: ', '').replace('Ejecutor: ', '')}</li>
                                                        </ul>
                                                    </>
                                                )}
                                                {activeLayer === 'storage' && (
                                                    <>
                                                        <p>{t('storageDesc1')}</p>
                                                        <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                                                            <li><strong>Access Methods:</strong> {t('storageDesc2').replace('Access Methods: ', '')}</li>
                                                            <li><strong>Transaction Manager:</strong> {t('storageDesc3').replace('Transaction Manager: ', '')}</li>
                                                            <li><strong>Buffer Manager:</strong> {t('storageDesc4').replace('Buffer Manager: ', '')}</li>
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-4">
                                            <Database className="w-16 h-16 opacity-20" />
                                            <p>{t('selectLayerPrompt')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'sysdbs' && (
                        <motion.div
                            key="sysdbs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full w-full grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-8"
                        >
                            <div className="col-span-full mb-2">
                                <p className="text-muted-foreground text-lg">{t('sysDbsDesc')}</p>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-rose-500 hover:-translate-y-1 transition-transform">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-rose-500/20 rounded-xl">
                                        <Settings className="w-8 h-8 text-rose-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-mono text-white">master</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('masterDesc')}
                                </p>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-blue-500 hover:-translate-y-1 transition-transform">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                        <LayoutTemplate className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-mono text-white">model</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('modelDesc')}
                                </p>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-purple-500 hover:-translate-y-1 transition-transform">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                        <Box className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-mono text-white">msdb</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('msdbDesc')}
                                </p>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl border-t-4 border-amber-500 hover:-translate-y-1 transition-transform">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-amber-500/20 rounded-xl">
                                        <Cpu className="w-8 h-8 text-amber-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-mono text-white">tempdb</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('tempdbDesc')}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'files' && (
                        <motion.div
                            key="files"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full w-full flex flex-col gap-6"
                        >
                            <p className="text-muted-foreground text-lg">{t('dbFilesDesc')}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 border-b-4 border-emerald-500 hover:bg-white/5 transition-colors">
                                    <Database className="w-12 h-12 text-emerald-400" />
                                    <div>
                                        <h3 className="text-xl font-bold font-mono">{t('mdfExt')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('mdfDesc1')}</p>
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 border-b-4 border-cyan-500 hover:bg-white/5 transition-colors">
                                    <Database className="w-12 h-12 text-cyan-400" />
                                    <div>
                                        <h3 className="text-xl font-bold font-mono">{t('ndfExt')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('mdfDesc4')}</p>
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-4 border-b-4 border-amber-500 hover:bg-white/5 transition-colors">
                                    <FileText className="w-12 h-12 text-amber-400" />
                                    <div>
                                        <h3 className="text-xl font-bold font-mono">{t('ldfExt')}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{t('ldfDesc1')} {t('ldfDesc2')}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
