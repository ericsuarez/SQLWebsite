import { motion } from 'framer-motion';
import { RotateCcw, Brain, Cpu, Zap, Layers, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { MODERN_FEATURES } from '../../data/advancedSQLData';

const ICONS: Record<string, any> = {
    RotateCcw,
    Brain,
    Cpu,
    Zap,
    Layers
};

export function ModernFeatures() {
    const { t } = useLanguage();

    const containerVars = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVars = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto text-slate-200">
            {/* Header */}
            <div className="flex-none p-6 border-b border-white/10 glass-panel relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 mb-2 flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-yellow-400" />
                            {t('tabModern')}
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-sm">
                            {t('modMainDesc')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 sm:p-8 flex flex-col items-center">
                <div className="w-full max-w-6xl relative">
                    
                    {/* Visual Connector Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-yellow-500/50 via-white/10 to-transparent -translate-x-1/2 hidden lg:block z-0" />

                    <motion.div 
                        variants={containerVars} 
                        initial="hidden" 
                        animate="show"
                        className="flex flex-col gap-12 lg:gap-8 relative z-10"
                    >
                        {MODERN_FEATURES.map((feat, idx) => {
                            const Icon = ICONS[feat.icon] || Sparkles;
                            const isLeft = idx % 2 === 0;

                            return (
                                <motion.div 
                                    key={feat.id} 
                                    variants={itemVars}
                                    className={cn(
                                        "flex flex-col lg:flex-row items-center w-full gap-8",
                                        !isLeft && "lg:flex-row-reverse"
                                    )}
                                >
                                    {/* Left/Right Content Block */}
                                    <div className={cn("w-full lg:w-1/2 flex", isLeft ? "lg:justify-end" : "lg:justify-start")}>
                                        <div className={cn(
                                            "glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 w-full lg:max-w-xl group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                                            \`hover:shadow-\${feat.color}-500/20 hover:border-\${feat.color}-500/50\`
                                        )}>
                                            <div className={cn(
                                                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none",
                                                \`from-\${feat.color}-500 via-transparent to-transparent\`
                                            )} />
                                            
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner flex-shrink-0",
                                                    \`bg-\${feat.color}-500/10 border-\${feat.color}-500/30 text-\${feat.color}-400\`
                                                )}>
                                                    <Icon className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h3 className={cn("text-2xl font-bold mb-1", \`text-\${feat.color}-400\`)}>{t(feat.titleKey)}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                                                            \`bg-\${feat.color}-500/20 text-\${feat.color}-300\`
                                                        )}>
                                                            SQL Server {feat.version}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-white/80 leading-relaxed font-medium">
                                                    {t(feat.descKey)}
                                                </p>
                                                <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-sm text-white/60 leading-relaxed shadow-inner">
                                                    {t(feat.detailKey)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center Node on Desktop */}
                                    <div className="hidden lg:flex w-16 justify-center relative z-20">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-4 shadow-glow",
                                            \`bg-background border-\${feat.color}-400\`
                                        )} />
                                    </div>

                                    {/* Empty Spacer on Desktop */}
                                    <div className="hidden lg:block lg:w-1/2" />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
