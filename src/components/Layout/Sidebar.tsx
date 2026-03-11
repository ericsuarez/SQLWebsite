import { Settings, Database, Server, HardDrive, Cpu, Shield, AlertTriangle, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';

export type ModuleId = 'architecture' | 'storage' | 'memory' | 'execution' | 'dba' | 'ha' | 'indexes';

interface SidebarProps {
    currentModule: ModuleId;
    onModuleChange: (id: ModuleId) => void;
}

const modules: { id: ModuleId; titleKey: TranslationKey; icon: any; color: string }[] = [
    { id: 'architecture', titleKey: 'architectureOverview', icon: Server, color: 'text-blue-400' },
    { id: 'storage', titleKey: 'storageEngine', icon: HardDrive, color: 'text-emerald-400' },
    { id: 'memory', titleKey: 'memoryOperations', icon: Cpu, color: 'text-purple-400' },
    { id: 'execution', titleKey: 'queryExecution', icon: Settings, color: 'text-amber-400' },
    { id: 'dba', titleKey: 'dbaScenarios', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 'ha', titleKey: 'highAvailability', icon: Shield, color: 'text-cyan-400' },
    { id: 'indexes', titleKey: 'indexVisualizer', icon: BookOpen, color: 'text-teal-400' },
];

export function Sidebar({ currentModule, onModuleChange }: SidebarProps) {
    const { t } = useLanguage();
    return (
        <aside className="w-64 border-r border-white/10 bg-background/50 backdrop-blur-xl flex flex-col h-full glass-panel">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg shadow-glowBlue">
                    <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-primary">{t('appTitle')}</h1>
                    <p className="text-xs text-muted-foreground font-medium">{t('appSubtitle')}</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 ml-2">{t('modules')}</div>
                {modules.map((m) => {
                    const Icon = m.icon;
                    const isActive = currentModule === m.id;
                    return (
                        <button
                            key={m.id}
                            onClick={() => onModuleChange(m.id as ModuleId)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium",
                                isActive
                                    ? "bg-white/10 text-white shadow-glow border border-white/5"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? m.color : "text-muted-foreground")} />
                            {t(m.titleKey)}
                        </button>
                    )
                })}
            </nav>

        </aside>
    );
}
