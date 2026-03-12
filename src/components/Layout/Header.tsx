import { useMemo, useState } from 'react';
import { Search, Activity, Database, Menu } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSqlVersion, type SqlVersion } from '../../contexts/SqlVersionContext';
import type { ModuleId } from './Sidebar';
import { MODULE_GROUPS, normalizeSearchValue } from './moduleCatalog';
import { cn } from '../../lib/utils';

interface HeaderProps {
    currentModule: ModuleId;
    onModuleChange: (id: ModuleId) => void;
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    onOpenSidebar: () => void;
}

export function Header({ currentModule, onModuleChange, searchQuery, onSearchQueryChange, onOpenSidebar }: HeaderProps) {
    const { t, language, setLanguage } = useLanguage();
    const { version, setVersion } = useSqlVersion();
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const searchResults = useMemo(() => {
        const normalizedQuery = normalizeSearchValue(searchQuery);
        if (!normalizedQuery) {
            return [];
        }

        return MODULE_GROUPS
            .flatMap((group) =>
                group.modules.map((module) => {
                    const title = t(module.titleKey);
                    const groupLabel = language === 'es' ? group.label.es : group.label.en;
                    const normalizedTitle = normalizeSearchValue(title);
                    const normalizedAliases = normalizeSearchValue(module.aliases.join(' '));
                    const normalizedGroup = normalizeSearchValue(groupLabel);

                    const matches =
                        normalizedTitle.includes(normalizedQuery) ||
                        normalizedAliases.includes(normalizedQuery) ||
                        normalizedGroup.includes(normalizedQuery);

                    if (!matches) {
                        return null;
                    }

                    let score = 0;
                    if (normalizedTitle.startsWith(normalizedQuery)) score += 6;
                    if (normalizedTitle.includes(normalizedQuery)) score += 4;
                    if (normalizedAliases.includes(normalizedQuery)) score += 2;
                    if (normalizedGroup.includes(normalizedQuery)) score += 1;

                    return { module, groupLabel, title, score };
                })
            )
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
            .slice(0, 10);
    }, [language, searchQuery, t]);

    const showSearchPanel = isSearchFocused && searchQuery.trim().length > 0;

    const goToModule = (moduleId: ModuleId) => {
        onModuleChange(moduleId);
        onSearchQueryChange('');
        setIsSearchFocused(false);
    };

    return (
        <header className="z-10 border-b border-white/10 bg-background/50 px-3 py-3 backdrop-blur-xl sm:px-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full min-w-0 items-center gap-3 lg:flex-1">
                    <button
                        type="button"
                        onClick={onOpenSidebar}
                        className="inline-flex rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                        aria-label={language === 'es' ? 'Abrir navegacion' : 'Open navigation'}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="relative min-w-0 flex-1 lg:max-w-sm xl:max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                                setIsSearchFocused(false);
                                return;
                            }
                            if (event.key === 'Enter' && searchResults.length > 0) {
                                goToModule(searchResults[0].module.id);
                            }
                        }}
                        placeholder={t('searchPlaceholder')}
                        className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-foreground transition-all duration-300 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 sm:py-1.5"
                    />

                    {showSearchPanel ? (
                        <div className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-2 shadow-xl">
                            <div className="px-2 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                                {language === 'es' ? 'Paginas encontradas' : 'Matching pages'}
                            </div>

                            {searchResults.length > 0 ? (
                                <div className="max-h-[50dvh] space-y-1 overflow-y-auto sm:max-h-[60vh]">
                                    {searchResults.map((result) => {
                                        const Icon = result.module.icon;
                                        const isCurrent = result.module.id === currentModule;
                                        return (
                                            <button
                                                key={result.module.id}
                                                onMouseDown={() => goToModule(result.module.id)}
                                                className={cn(
                                                    'w-full rounded-xl border px-3 py-2 text-left transition-all',
                                                    isCurrent
                                                        ? 'border-primary/40 bg-primary/10'
                                                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.08]'
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className={cn('h-4 w-4', result.module.color)} />
                                                    <span className="text-sm font-semibold text-white">{result.title}</span>
                                                </div>
                                                <p className="mt-1 text-xs text-white/55">
                                                    {language === 'es' ? 'Seccion' : 'Section'}: {result.groupLabel}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-2 py-3 text-xs text-white/55">
                                    {language === 'es'
                                        ? 'No hay coincidencias. Prueba con terminos como tempdb, sqlos, replication, jobs o indices.'
                                        : 'No matches found. Try terms like tempdb, sqlos, replication, jobs or indexes.'}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-3 lg:w-auto lg:flex-nowrap lg:gap-4">
                {/* SQL Version Switcher */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 hidden md:flex">
                    <Database className="w-3.5 h-3.5 text-muted-foreground ml-2 mr-1" />
                    {(['2019', '2022', '2025'] as SqlVersion[]).map(v => (
                        <button
                            key={v}
                            onClick={() => setVersion(v)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all ${version === v ? 'bg-purple-500/20 text-purple-400' : 'text-muted-foreground hover:text-white'}`}
                        >
                            SQL '{v.substring(2)}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-white/10 hidden md:block" />

                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-2 py-1 min-w-[32px] rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-white'}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('es')}
                        className={`px-2 py-1 min-w-[32px] rounded text-xs font-bold transition-all ${language === 'es' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-white'}`}
                    >
                        ES
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    {t('online')}
                </div>
                </div>
            </div>
        </header>
    );
}
