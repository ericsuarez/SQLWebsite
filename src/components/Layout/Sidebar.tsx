import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Database, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ALL_MODULES,
  SURFACE_DEFINITIONS,
  SURFACE_SECTIONS,
  getModuleDefinition,
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
    setExpandedSections((previous) => (previous[currentSectionId] ? previous : { ...previous, [currentSectionId]: true }));
  }, [currentSectionId]);

  const renderModuleButton = (module: (typeof ALL_MODULES)[number]) => {
    const Icon = module.icon;
    const isActive = currentModule === module.id;
    return (
      <button
        key={module.id}
        onClick={() => onModuleChange(module.id)}
        className={cn(
          'w-full rounded-xl text-left transition-all duration-300',
          showCompact ? 'flex justify-center px-0 py-3' : 'px-4 py-3',
          isActive
            ? 'border border-white/10 bg-white/10 text-white shadow-[0_12px_30px_rgba(0,0,0,0.16)]'
            : 'border border-transparent text-white/62 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
        )}
        title={t(module.titleKey)}
      >
        <div className={cn('flex items-center', showCompact ? 'justify-center' : 'gap-3')}>
          <Icon className={cn('h-5 w-5', isActive ? module.color : 'text-white/40')} />
          {!showCompact ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">{t(module.titleKey)}</div>
              <div className="mt-1 truncate text-xs text-white/42">{module.level ? `L${module.level}` : pickSurface(language, module.primaryHome)}</div>
            </div>
          ) : null}
        </div>
      </button>
    );
  };

  return (
    <aside
      className={cn(
        'glass-panel fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-white/10 bg-[#0d1314]/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        showCompact ? 'lg:w-20' : 'lg:w-80',
        'w-[88vw] max-w-[340px] lg:max-w-none'
      )}
    >
      <div className={cn('flex items-center justify-between gap-3 border-b border-white/10 p-6 transition-all duration-300', showCompact && 'px-4 justify-center')}>
        <div className="min-w-0">
          <button onClick={() => onSurfaceChange(currentSurface)} className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-2 shadow-[0_0_30px_rgba(20,184,166,0.08)]">
              <Database className="h-6 w-6 text-teal-300" />
            </div>
            {!showCompact ? (
              <div className="min-w-0">
                <h1 className="truncate bg-gradient-to-r from-teal-200 via-amber-100 to-lime-200 bg-clip-text text-lg font-black tracking-tight text-transparent">
                  {t('appTitle')}
                </h1>
                <p className="truncate text-xs font-medium text-white/46">{pickSurface(language, currentSurface)}</p>
              </div>
            ) : null}
          </button>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="flex rounded-lg border border-white/10 bg-white/5 p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label={language === 'es' ? 'Cerrar navegación' : 'Close navigation'}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className={cn('flex-1 overflow-y-auto', showCompact ? 'p-3' : 'p-4')}>
        {!showCompact ? (
          <div className="mb-4 ml-2 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', currentSurface === 'learn' ? 'bg-teal-300' : currentSurface === 'labs' ? 'bg-amber-300' : currentSurface === 'diagnose' ? 'bg-lime-300' : 'bg-cyan-300')} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
              {pickSurface(language, currentSurface)}
            </span>
          </div>
        ) : null}

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
                      <div className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-white/55">
                        {language === 'es' ? section.label.es : section.label.en}
                      </div>
                      <div className="mt-1 truncate text-xs text-white/38">
                        {'xp' in section && section.xp ? `${section.xp} XP` : language === 'es' ? section.description.es : section.description.en}
                      </div>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 shrink-0 text-white/45 transition-transform', isExpanded ? 'rotate-180' : 'rotate-0')} />
                  </button>
                ) : null}

                {isExpanded ? (
                  <div className={cn('space-y-1 border-t border-white/10', showCompact ? 'px-1 py-2' : 'px-2 py-2')}>
                    {section.modules.map((module) => renderModuleButton(module))}
                  </div>
                ) : null}
              </div>
            );
          })}

          {hasSearch && sections.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-white/55">
              {language === 'es' ? 'Sin resultados en esta superficie' : 'No results in this surface'}
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
          {!showCompact ? <span>{isCollapsed ? (language === 'es' ? 'Expandir' : 'Expand') : language === 'es' ? 'Colapsar' : 'Collapse'}</span> : null}
        </button>
      </div>
    </aside>
  );
}

function pickSurface(language: 'en' | 'es', surface: SurfaceId) {
  return language === 'es' ? SURFACE_DEFINITIONS[surface].title.es : SURFACE_DEFINITIONS[surface].title.en;
}
