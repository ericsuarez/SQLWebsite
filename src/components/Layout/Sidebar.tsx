import { Settings, Database, Server, HardDrive, Cpu, Shield, AlertTriangle, BookOpen, Siren, Zap, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';

export type ModuleId = 'architecture' | 'storage' | 'memory' | 'execution' | 'dba' | 'ha' | 'indexes' | 'realcases' | 'osconfig' | 'perfmon' | 'sqlos' | 'modern';

interface SidebarProps {
    currentModule: ModuleId;
    onModuleChange: (id: ModuleId) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const modules: { id: ModuleId; titleKey: TranslationKey; icon: any; color: string }[] = [
    { id: 'architecture', titleKey: 'architectureOverview', icon: Server, color: 'text-blue-400' },
    { id: 'storage', titleKey: 'storageEngine', icon: HardDrive, color: 'text-emerald-400' },
    { id: 'memory', titleKey: 'memoryOperations', icon: Cpu, color: 'text-purple-400' },
    { id: 'execution', titleKey: 'queryExecution', icon: Settings, color: 'text-amber-400' },
    { id: 'dba', titleKey: 'dbaScenarios', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 'realcases', titleKey: 'realCasesTitle', icon: Siren, color: 'text-cyan-400' },
    { id: 'ha', titleKey: 'highAvailability', icon: Shield, color: 'text-sky-400' },
    { id: 'indexes', titleKey: 'indexVisualizer', icon: BookOpen, color: 'text-teal-400' },
    { id: 'osconfig', titleKey: 'tabOsConfig', icon: Server, color: 'text-indigo-400' },
    { id: 'perfmon', titleKey: 'tabPerfMon', icon: Cpu, color: 'text-fuchsia-400' },
    { id: 'sqlos', titleKey: 'tabSqlOs', icon: Database, color: 'text-violet-400' },
    { id: 'modern', titleKey: 'tabModern', icon: Zap, color: 'text-yellow-400' },
];

export function Sidebar({ currentModule, onModuleChange, isCollapsed, onToggleCollapse }: SidebarProps) {
    const { t } = useLanguage();
    return (
        <aside
            className={cn(
                'border-r border-white/10 bg-background/50 backdrop-blur-xl flex flex-col h-full glass-panel transition-[width] duration-300',
                isCollapsed ? 'w-20' : 'w-72'
            )}
        >
            <div className={cn('border-b border-white/10 flex items-center gap-3', isCollapsed ? 'p-4 justify-center' : 'p-5')}>
                <div className="p-2 bg-primary/20 rounded-lg shadow-glowBlue shrink-0">
                    <Database className="w-6 h-6 text-primary" />
                </div>
                {!isCollapsed && (
                    <div className="min-w-0">
                        <h1 className="truncate font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-primary">{t('appTitle')}</h1>
                        <p className="truncate text-xs text-muted-foreground font-medium">{t('appSubtitle')}</p>
                    </div>
                )}
                <button
                    onClick={onToggleCollapse}
                    className={cn(
                        'ml-auto rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white',
                        isCollapsed && 'ml-0'
                    )}
                    title={isCollapsed ? 'Expandir sidebar' : 'Comprimir sidebar'}
                >
                    {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>
            </div>

            <nav className={cn('flex-1 overflow-y-auto space-y-2', isCollapsed ? 'p-3' : 'p-4')}>
                {!isCollapsed && <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 ml-2">{t('modules')}</div>}
                {modules.map((m) => {
                    const Icon = m.icon;
                    const isActive = currentModule === m.id;
                    return (
                        <button
                            key={m.id}
                            onClick={() => onModuleChange(m.id as ModuleId)}
                            className={cn(
                                "w-full flex items-center rounded-xl transition-all duration-300 text-sm font-medium",
                                isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
                                isActive
                                    ? "bg-white/10 text-white shadow-glow border border-white/5"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                            title={t(m.titleKey)}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? m.color : "text-muted-foreground")} />
                            {!isCollapsed && <span className="truncate text-left leading-tight">{t(m.titleKey)}</span>}
                        </button>
                    )
                })}
            </nav>

        </aside>
    );
}
