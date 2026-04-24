import { useMemo, useState } from 'react';
import { Activity, BookOpen, ChevronDown, Database, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSqlVersion, type SqlVersion } from '../../contexts/SqlVersionContext';
import {
  ALL_MODULES,
  SURFACE_DEFINITIONS,
  SURFACE_SECTIONS,
  getModuleDefinition,
  getModuleStepIndex,
  getPrimarySectionForModule,
  normalizeSearchValue,
  type ModuleId,
  type SurfaceId,
} from './moduleCatalog';

interface HeaderProps {
  currentSurface: SurfaceId;
  currentModule: ModuleId | null;
  onSurfaceChange: (surface: SurfaceId) => void;
  onNavigateToModule: (surface: SurfaceId, moduleId: ModuleId) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

function pick(language: 'en' | 'es', value: { en: string; es: string }) {
  return language === 'es' ? value.es : value.en;
}

export function Header({
  currentSurface,
  currentModule,
  onSurfaceChange,
  onNavigateToModule,
  searchQuery,
  onSearchQueryChange,
}: HeaderProps) {
  const { t, language, setLanguage } = useLanguage();
  const { version, setVersion } = useSqlVersion();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const navigationSurfaces: SurfaceId[] = ['learn', 'diagnose'];

  const currentSurfaceModules = useMemo(
    () =>
      SURFACE_SECTIONS[currentSurface].flatMap((section) =>
        section.moduleIds
          .map((moduleId) => getModuleDefinition(moduleId))
          .filter((module): module is NonNullable<typeof module> => Boolean(module))
      ),
    [currentSurface]
  );

  const activeModule = currentModule ? getModuleDefinition(currentModule) : undefined;

  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery);
    if (!normalizedQuery) {
      return [];
    }

    return ALL_MODULES.map((module) => {
      const title = t(module.titleKey);
      const normalizedTitle = normalizeSearchValue(title);
      const normalizedAliases = normalizeSearchValue(module.aliases.join(' '));
      const surfaceLabel = pick(language, SURFACE_DEFINITIONS[module.primaryHome].title);
      const section = getPrimarySectionForModule(module.id);
      const sectionLabel = section ? pick(language, section.label) : surfaceLabel;
      const normalizedSurface = normalizeSearchValue(surfaceLabel);
      const normalizedSection = normalizeSearchValue(sectionLabel);

      const matches =
        normalizedTitle.includes(normalizedQuery) ||
        normalizedAliases.includes(normalizedQuery) ||
        normalizedSurface.includes(normalizedQuery) ||
        normalizedSection.includes(normalizedQuery);

      if (!matches) {
        return null;
      }

      let score = 0;
      if (normalizedTitle.startsWith(normalizedQuery)) score += 6;
      if (normalizedTitle.includes(normalizedQuery)) score += 4;
      if (normalizedAliases.includes(normalizedQuery)) score += 2;
      if (normalizedSurface.includes(normalizedQuery)) score += 1;
      if (normalizedSection.includes(normalizedQuery)) score += 1;

      return {
        module,
        score,
        title,
        surfaceLabel,
        sectionLabel,
      };
    })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
      .slice(0, 10);
  }, [language, searchQuery, t]);

  const showSearchPanel = isSearchFocused && searchQuery.trim().length > 0;

  const goToModule = (surface: SurfaceId, moduleId: ModuleId) => {
    onNavigateToModule(surface, moduleId);
    onSearchQueryChange('');
    setIsSearchFocused(false);
    setIsModuleMenuOpen(false);
  };

  return (
    <header className="z-10 border-b border-white/10 bg-[#0d1314]/72 px-3 py-3 backdrop-blur-xl sm:px-4 md:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full min-w-0 items-center gap-3 lg:flex-1">
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-2 shadow-[0_0_30px_rgba(20,184,166,0.08)]">
                <Database className="h-5 w-5 text-teal-300" />
              </div>
              <div className="hidden min-w-0 text-left sm:block">
                <h1 className="truncate bg-gradient-to-r from-teal-200 via-amber-100 to-lime-200 bg-clip-text text-lg font-black tracking-tight text-transparent">
                  {t('appTitle')}
                </h1>
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {pick(language, SURFACE_DEFINITIONS[currentSurface].title)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              {navigationSurfaces.map((surface) => {
                const meta = SURFACE_DEFINITIONS[surface];
                const Icon = meta.icon;
                const isActive = surface === currentSurface;

                return (
                  <button
                    key={surface}
                    type="button"
                    onClick={() => onSurfaceChange(surface)}
                    className={cn(
                      'inline-flex min-w-10 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-black transition-all',
                      isActive ? meta.chipClassName : 'text-white/55 hover:bg-white/8 hover:text-white'
                    )}
                    title={pick(language, meta.title)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{pick(language, meta.title)}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-0 flex-1 lg:max-w-sm xl:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
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
                    goToModule(searchResults[0].module.primaryHome, searchResults[0].module.id);
                  }
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white transition-all duration-300 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-teal-500/45 sm:py-1.5"
              />

              {showSearchPanel ? (
                <div className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-white/10 bg-[#0b1112]/95 p-2 shadow-xl backdrop-blur-xl">
                  <div className="px-2 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                    {language === 'es' ? 'Módulos encontrados' : 'Matching modules'}
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="max-h-[50dvh] space-y-1 overflow-y-auto sm:max-h-[60vh]">
                      {searchResults.map((result) => {
                        const Icon = result.module.icon;
                        const isCurrent =
                          result.module.id === currentModule &&
                          result.module.primaryHome === currentSurface;

                        return (
                          <button
                            key={`${result.module.primaryHome}-${result.module.id}`}
                            onMouseDown={() => goToModule(result.module.primaryHome, result.module.id)}
                            className={cn(
                              'w-full rounded-xl border px-3 py-2 text-left transition-all',
                              isCurrent
                                ? 'border-teal-500/35 bg-teal-500/10'
                                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.08]'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={cn('h-4 w-4', result.module.color)} />
                              <span className="text-sm font-semibold text-white">{result.title}</span>
                            </div>
                            <p className="mt-1 text-xs text-white/55">
                              {language === 'es' ? 'Ruta' : 'Route'}: {result.surfaceLabel} · {result.sectionLabel}
                              {result.module.level ? ` · L${result.module.level}` : ''}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-2 py-3 text-xs text-white/55">
                      {language === 'es'
                        ? 'No hay coincidencias. Prueba con tempdb, sqlos, jobs, xevents o índices.'
                        : 'No matches found. Try tempdb, sqlos, jobs, xevents, or indexes.'}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div
              className="relative w-full sm:w-72"
              onBlur={() => window.setTimeout(() => setIsModuleMenuOpen(false), 120)}
            >
              <button
                type="button"
                onClick={() => setIsModuleMenuOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#11191a] px-3 py-2 text-left text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition-all hover:bg-[#162021]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <BookOpen className="h-4 w-4 shrink-0 text-teal-300" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
                      {language === 'es' ? 'Modulos' : 'Modules'}
                    </div>
                    <div className="truncate text-sm font-black">
                      {activeModule ? t(activeModule.titleKey) : language === 'es' ? 'Elegir modulo' : 'Choose module'}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-white/45 transition-transform',
                    isModuleMenuOpen ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>

              {isModuleMenuOpen ? (
                <div className="absolute left-0 right-0 z-50 mt-2 max-h-[68dvh] overflow-y-auto rounded-2xl border border-white/12 bg-[#0b1112] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.72)]">
                  {currentSurfaceModules.map((module) => {
                    const Icon = module.icon;
                    const isCurrent = module.id === currentModule;
                    const stepIndex = getModuleStepIndex(currentSurface, module.id);

                    return (
                      <button
                        key={`${currentSurface}-${module.id}`}
                        onMouseDown={() => goToModule(currentSurface, module.id)}
                        className={cn(
                          'w-full rounded-xl border px-3 py-2 text-left transition-all',
                          isCurrent
                            ? 'border-teal-500/45 bg-[#062f2b] text-white'
                            : 'border-transparent bg-[#0f1718] text-white/72 hover:border-white/12 hover:bg-[#172122] hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25 text-[10px] font-black text-white/55">
                            {stepIndex + 1}
                          </span>
                          <Icon className={cn('h-4 w-4 shrink-0', isCurrent ? module.color : 'text-white/42')} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{t(module.titleKey)}</div>
                            <div className="mt-0.5 truncate text-xs text-white/42">
                              {module.level ? `L${module.level}` : pick(language, SURFACE_DEFINITIONS[module.primaryHome].title)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-3 lg:w-auto lg:flex-nowrap lg:gap-4">
            <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 md:flex">
              <Database className="ml-2 mr-1 h-3.5 w-3.5 text-white/40" />
              {(['2019', '2022', '2025'] as SqlVersion[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setVersion(item)}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-bold transition-all',
                    version === item ? 'bg-amber-500/20 text-amber-200' : 'text-white/52 hover:text-white'
                  )}
                >
                  SQL '{item.substring(2)}
                </button>
              ))}
            </div>

            <div className="hidden h-6 w-px bg-white/10 md:block" />

            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  'min-w-[32px] rounded px-2 py-1 text-xs font-bold transition-all',
                  language === 'en' ? 'bg-teal-500/20 text-teal-200' : 'text-white/52 hover:text-white'
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={cn(
                  'min-w-[32px] rounded px-2 py-1 text-xs font-bold transition-all',
                  language === 'es' ? 'bg-teal-500/20 text-teal-200' : 'text-white/52 hover:text-white'
                )}
              >
                ES
              </button>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-lime-500/20 bg-lime-500/10 px-3 py-1.5 text-xs font-medium text-lime-300 sm:flex">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              {t('online')}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
