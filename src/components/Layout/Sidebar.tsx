import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Database, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { ALL_MODULES, MODULE_GROUPS, normalizeSearchValue, type ModuleGroupId } from './moduleCatalog';

export type ModuleId = 'architecture' | 'storage' | 'memory' | 'execution' | 'jobs' | 'ha' | 'indexes' | 'realcases' | 'xevents' | 'osconfig' | 'perfmon' | 'sqlos' | 'modern' | 'tlog-internals' | 'tempdb-io' | 'replication' | 'version-history';

interface SidebarProps {
    currentModule: ModuleId;
    onModuleChange: (id: ModuleId) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    searchQuery?: string;
    isMobileOpen: boolean;
    onCloseMobile: () => void;
}

const DEFAULT_GROUP_STATE: Record<ModuleGroupId, boolean> = {
    engine: true,
    operations: true,
    internals: true,
};

export function Sidebar({
    currentModule,
    onModuleChange,
    isCollapsed,
    onToggleCollapse,
    searchQuery = '',
    isMobileOpen,
    onCloseMobile,
}: SidebarProps) {
    const { t, language } = useLanguage();
    const [expandedGroups, setExpandedGroups] = useState<Record<ModuleGroupId, boolean>>(DEFAULT_GROUP_STATE);
    const showCompact = isCollapsed && !isMobileOpen;

    const currentGroupId = useMemo(
        () => MODULE_GROUPS.find((group) => group.modules.some((module) => module.id === currentModule))?.id,
        [currentModule]
    );

    useEffect(() => {
        if (!currentGroupId) {
            return;
        }
        setExpandedGroups((previous) => (previous[currentGroupId] ? previous : { ...previous, [currentGroupId]: true }));
    }, [currentGroupId]);

    const normalizedQuery = normalizeSearchValue(searchQuery);
    const hasSearch = normalizedQuery.length > 0;

    const filteredGroups = useMemo(() => {
        if (!hasSearch) {
            return MODULE_GROUPS;
        }
        return MODULE_GROUPS.map((group) => ({
            ...group,
            modules: group.modules.filter((module) => {
                const title = normalizeSearchValue(t(module.titleKey));
                const aliases = normalizeSearchValue(module.aliases.join(' '));
                return title.includes(normalizedQuery) || aliases.includes(normalizedQuery);
            }),
        })).filter((group) => group.modules.length > 0);
    }, [hasSearch, normalizedQuery, t]);

    const renderModuleButton = (module: (typeof ALL_MODULES)[number]) => {
        const Icon = module.icon;
        const isActive = currentModule === module.id;
        return (
            <button
                key={module.id}
                onClick={() => onModuleChange(module.id as ModuleId)}
                className={cn(
                    'w-full flex items-center rounded-xl transition-all duration-300 text-sm font-medium',
                    showCompact ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-2.5',
                    isActive
                        ? 'bg-white/10 text-white shadow-glow border border-white/5'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                )}
                title={t(module.titleKey)}
            >
                <Icon className={cn('w-5 h-5', isActive ? module.color : 'text-muted-foreground')} />
                {!showCompact && <span className="truncate text-left leading-tight">{t(module.titleKey)}</span>}
            </button>
        );
    };

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-white/10 bg-background/95 backdrop-blur-xl glass-panel transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
                isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                showCompact ? 'lg:w-20' : 'lg:w-72',
                'w-[88vw] max-w-[320px] lg:max-w-none'
            )}
        >
            <div className={cn('border-b border-white/10 flex items-center gap-3', showCompact ? 'p-4 justify-center' : 'p-5')}>
                <div className="p-2 bg-primary/20 rounded-lg shadow-glowBlue shrink-0">
                    <Database className="w-6 h-6 text-primary" />
                </div>
                {!showCompact && (
                    <div className="min-w-0">
                        <h1 className="truncate font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-primary">{t('appTitle')}</h1>
                        <p className="truncate text-xs text-muted-foreground font-medium">{t('appSubtitle')}</p>
                    </div>
                )}
                <button
                    onClick={onToggleCollapse}
                    className={cn(
                        'ml-auto hidden rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white lg:inline-flex',
                        showCompact && 'ml-0'
                    )}
                    title={isCollapsed ? 'Expandir sidebar' : 'Comprimir sidebar'}
                >
                    {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>
                <button
                    type="button"
                    onClick={onCloseMobile}
                    className="ml-auto inline-flex rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                    aria-label={language === 'es' ? 'Cerrar navegacion' : 'Close navigation'}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <nav className={cn('flex-1 overflow-y-auto space-y-2', showCompact ? 'p-3' : 'p-4')}>
                {!showCompact && <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 ml-2">{t('modules')}</div>}

                {showCompact ? (
                    <div className="space-y-2">
                        {ALL_MODULES.map((module) => renderModuleButton(module))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredGroups.map((group) => {
                            const isExpanded = hasSearch || expandedGroups[group.id];
                            return (
                                <div key={group.id} className="rounded-2xl border border-white/10 bg-black/20">
                                    <button
                                        onClick={() => setExpandedGroups((previous) => ({ ...previous, [group.id]: !previous[group.id] }))}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">
                                            {language === 'es' ? group.label.es : group.label.en}
                                        </span>
                                        <ChevronDown
                                            className={cn(
                                                'h-4 w-4 text-white/55 transition-transform',
                                                isExpanded ? 'rotate-180' : 'rotate-0'
                                            )}
                                        />
                                    </button>
                                    {isExpanded ? (
                                        <div className="space-y-1 border-t border-white/10 px-2 py-2">
                                            {group.modules.map((module) => renderModuleButton(module))}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}

                        {hasSearch && filteredGroups.length === 0 ? (
                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-white/55">
                                {language === 'es' ? 'Sin resultados en paginas del sidebar' : 'No results in sidebar pages'}
                            </div>
                        ) : null}
                    </div>
                )}
            </nav>

        </aside>
    );
}
