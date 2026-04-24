import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Database, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ALL_MODULES,
  SURFACE_DEFINITIONS,
  SURFACE_SECTIONS,
  getModuleDefinition,
  getModuleStepIndex,
  normalizeSearchValue,
  type ModuleId,
  type SurfaceId,
} from './moduleCatalog';

interface SidebarProps {
  currentSurface: SurfaceId;
  currentModule: ModuleId | null;
  onModuleChange: (id: ModuleId) => void;
  onSurfaceChange: (surface: SurfaceId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  searchQuery?: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

function pick(language: 'en' | 'es', value: { en: string; es: string }) {
  return language === 'es' ? value.es : value.en;
}

const SURFACE_ACCENTS = {
  learn: {
    rail: 'bg-teal-400',
    chip: 'border-teal-500/25 bg-teal-500/10 text-teal-200',
    button: 'border-teal-500/25 bg-teal-500/10 text-teal-100 hover:bg-teal-500/20',
  },
  labs: {
    rail: 'bg-amber-400',
    chip: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
    button: 'border-amber-500/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20',
  },
  diagnose: {
    rail: 'bg-lime-400',
    chip: 'border-lime-500/25 bg-lime-500/10 text-lime-200',
    button: 'border-lime-500/25 bg-lime-500/10 text-lime-100 hover:bg-lime-500/20',
  },
} as const;

export function Sidebar({
  currentSurface,
  currentModule,
  onModuleChange,
  onSurfaceChange,
  isCollapsed,
  onToggleCollapse,
  searchQuery = '',
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { t, language } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const showCompact = isCollapsed && !isMobileOpen;
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const hasSearch = normalizedQuery.length > 0;
  const showModuleIndex = Boolean(currentModule) || hasSearch;
  const accents = SURFACE_ACCENTS[currentSurface];
  const navigationSurfaces: SurfaceId[] = ['learn', 'diagnose'];

  const sections = useMemo(() => {
    const baseSections = SURFACE_SECTIONS[currentSurface].map((section) => ({
      ...section,
      modules: section.moduleIds
        .map((moduleId) => getModuleDefinition(moduleId))
        .filter((module): module is NonNullable<typeof module> => Boolean(module)),
    }));

    if (!hasSearch) {
      return baseSections;
    }

    return baseSections
      .map((section) => ({
        ...section,
        modules: section.modules.filter((module) => {
          const title = normalizeSearchValue(t(module.titleKey));
          const aliases = normalizeSearchValue(module.aliases.join(' '));
          return title.includes(normalizedQuery) || aliases.includes(normalizedQuery);
        }),
      }))
      .filter((section) => section.modules.length > 0);
  }, [currentSurface, hasSearch, normalizedQuery, t]);

  useEffect(() => {
    const defaults = Object.fromEntries(SURFACE_SECTIONS[currentSurface].map((section) => [section.id, true]));
    setExpandedSections(defaults);
  }, [currentSurface]);

  const currentSectionId = useMemo(
    () =>
      currentModule
        ? SURFACE_SECTIONS[currentSurface].find((section) => section.moduleIds.includes(currentModule))?.id
        : undefined,
    [currentModule, currentSurface]
  );

  useEffect(() => {
    if (!currentSectionId) return;
    setExpandedSections((previous) =>
      previous[currentSectionId] ? previous : { ...previous, [currentSectionId]: true }
    );
  }, [currentSectionId]);

  const renderModuleButton = (module: (typeof ALL_MODULES)[number]) => {
    const Icon = module.icon;
    const isActive = currentModule === module.id;
    const stepIndex = getModuleStepIndex(currentSurface, module.id);

    return (
      <button
        key={module.id}
        onClick={() => onModuleChange(module.id)}
        className={cn(
          'relative w-full rounded-xl border text-left transition-all duration-300',
          showCompact ? 'flex justify-center px-0 py-3' : 'px-4 py-3',
          isActive
            ? 'border-white/10 bg-white/10 text-white shadow-[0_12px_30px_rgba(0,0,0,0.16)]'
            : 'border-transparent text-white/62 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
        )}
        title={t(module.titleKey)}
      >
        {isActive && !showCompact ? (
          <div className={cn('absolute inset-y-2 left-0 w-1 rounded-r-full', accents.rail)} />
        ) : null}

        <div className={cn('flex items-center', showCompact ? 'justify-center' : 'gap-3')}>
          {!showCompact ? (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25 text-[10px] font-black text-white/60">
              {stepIndex + 1}
            </div>
          ) : null}

          <Icon className={cn('h-5 w-5 shrink-0', isActive ? module.color : 'text-white/40')} />

          {!showCompact ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">{t(module.titleKey)}</div>
              <div className="mt-1 truncate text-xs text-white/42">
                {module.level ? `L${module.level}` : pick(language, SURFACE_DEFINITIONS[module.primaryHome].title)}
              </div>
            </div>
          ) : null}
        </div>
      </button>
    );
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-white/10 bg-slate-900/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        showCompact ? 'lg:w-20' : 'lg:w-80',
        'w-[88vw] max-w-[340px] lg:max-w-none'
      )}
    >
      <div
        className={cn(
          'border-b border-white/5 bg-slate-950/30 p-4 transition-all duration-300',
          showCompact && 'px-3'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={cn('flex min-w-0 items-center gap-3', showCompact && 'justify-center')}>
            <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-2 shadow-[0_0_30px_rgba(20,184,166,0.08)]">
              <Database className="h-5 w-5 text-teal-300" />
            </div>
            {!showCompact ? (
              <div className="min-w-0 text-left">
                <h1 className="truncate bg-gradient-to-r from-teal-200 via-amber-100 to-lime-200 bg-clip-text text-lg font-black tracking-tight text-transparent">
                  {t('appTitle')}
                </h1>
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {pick(language, SURFACE_DEFINITIONS[currentSurface].title)}
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="flex rounded-lg border border-white/10 bg-white/5 p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={language === 'es' ? 'Cerrar navegacion' : 'Close navigation'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!showCompact ? (
          <div className="mt-4 grid gap-2">
            {navigationSurfaces.map((surface) => {
              const meta = SURFACE_DEFINITIONS[surface];
              const Icon = meta.icon;
              const isActive = surface === currentSurface;

              return (
                <button
                  key={surface}
                  onClick={() => onSurfaceChange(surface)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all',
                    isActive
                      ? 'border-white/10 bg-white/10 text-white'
                      : 'border-transparent bg-white/[0.02] text-white/60 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                      <Icon className={cn('h-4 w-4', meta.textClassName)} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{pick(language, meta.title)}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/38">
                        {pick(language, meta.kicker)}
                      </div>
                    </div>
                  </div>
                  {isActive ? <div className={cn('h-8 w-1 rounded-full', accents.rail)} /> : null}
                </button>
              );
            })}
          </div>
        ) : null}

      </div>

      <nav className={cn('flex-1 overflow-y-auto', showCompact ? 'p-3' : 'p-4')}>
        <div className="space-y-3">
          {sections.map((section) => {
            const isExpanded = hasSearch || expandedSections[section.id];

            return (
              <div key={section.id} className="rounded-2xl border border-white/10 bg-black/20">
                {!showCompact ? (
                  <button
                    onClick={() => setExpandedSections((previous) => ({ ...previous, [section.id]: !previous[section.id] }))}
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                        {pick(language, section.label)}
                      </div>
                      <div className="mt-1 truncate text-xs text-white/55">{pick(language, section.goal)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.xp ? (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black text-white/45">
                          XP {section.xp}
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black text-white/45">
                          {section.moduleIds.length}
                        </span>
                      )}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-white/45 transition-transform',
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        )}
                      />
                    </div>
                  </button>
                ) : null}

                {isExpanded ? (
                  showModuleIndex ? (
                    <div className={cn('space-y-1 border-t border-white/10', showCompact ? 'px-1 py-2' : 'px-2 py-2')}>
                      {section.modules.map((module) => renderModuleButton(module))}
                    </div>
                  ) : (
                    <div className="border-t border-white/10 px-3 py-3">
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                          {language === 'es' ? 'Qué vas a ver aquí' : 'What this block covers'}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/62">{pick(language, section.description)}</p>
                        <div className="mt-3 text-xs text-white/45">
                          {section.moduleIds.length} {language === 'es' ? 'módulos en esta etapa' : 'modules in this stage'}
                        </div>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            );
          })}

          {hasSearch && sections.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-white/55">
              {language === 'es' ? 'Sin resultados en esta area' : 'No results in this area'}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={onToggleCollapse}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/62 transition-all hover:bg-white/10 hover:text-white',
            showCompact && 'justify-center px-0'
          )}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {!showCompact ? (
            <span>{isCollapsed ? (language === 'es' ? 'Expandir' : 'Expand') : language === 'es' ? 'Colapsar' : 'Collapse'}</span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
