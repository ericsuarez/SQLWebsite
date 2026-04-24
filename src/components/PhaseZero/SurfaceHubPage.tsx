import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, Milestone, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import {
  SURFACE_DEFINITIONS,
  SURFACE_SECTIONS,
  buildModulePath,
  getModuleDefinition,
  type SurfaceId,
} from '../Layout/moduleCatalog';

function pick<T>(language: 'en' | 'es', value: { en: T; es: T }) {
  return language === 'es' ? value.es : value.en;
}

function getContentLabel(surface: SurfaceId, language: 'en' | 'es') {
  if (surface === 'learn') {
    return language === 'es' ? 'Curso' : 'Course';
  }

  if (surface === 'labs') {
    return language === 'es' ? 'Lab' : 'Lab';
  }

  return language === 'es' ? 'Recurso' : 'Resource';
}

export function SurfaceHubPage({ surface }: { surface: SurfaceId }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const surfaceMeta = SURFACE_DEFINITIONS[surface];
  const sections = SURFACE_SECTIONS[surface];
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  useEffect(() => {
    setActiveSectionIndex(0);
  }, [surface]);

  if (sections.length === 0) {
    return null;
  }

  const activeSection = sections[Math.min(activeSectionIndex, sections.length - 1)];
  const modules = activeSection.moduleIds
    .map((moduleId) => getModuleDefinition(moduleId))
    .filter((module): module is NonNullable<typeof module> => Boolean(module));
  const starterModule = modules[0];
  const finisherModule = modules[modules.length - 1];
  const progressPercent = Math.round(((activeSectionIndex + 1) / sections.length) * 100);
  const canGoBack = activeSectionIndex > 0;
  const canGoForward = activeSectionIndex < sections.length - 1;
  const contentLabel = getContentLabel(surface, language);
  const contentLabelPlural =
    surface === 'learn'
      ? language === 'es'
        ? 'Cursos y labs'
        : 'Courses and labs'
      : surface === 'labs'
      ? 'Labs'
      : language === 'es'
      ? 'Recursos'
      : 'Resources';

  const openModule = (moduleId: NonNullable<typeof starterModule>['id']) => {
    const module = getModuleDefinition(moduleId);
    if (!module) return;

    navigate(
      buildModulePath(surface, module.id, {
        view: module.defaultSubview,
        mode: module.defaultMode,
      })
    );
  };

  return (
    <div className="flex min-h-full flex-col gap-4">
      <section className="glass-panel border border-white/10 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]',
                surfaceMeta.chipClassName
              )}
            >
              <surfaceMeta.icon className="h-3.5 w-3.5" />
              {contentLabelPlural} - {pick(language, surfaceMeta.title)}
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {pick(language, activeSection.label)}
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-white/68">{pick(language, activeSection.description)}</p>

            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-2 sm:flex-row sm:items-center">
              <div className="flex shrink-0 items-center gap-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                <Compass className="h-4 w-4 text-teal-300" />
                {language === 'es' ? 'Etapas' : 'Stages'}
              </div>

              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
                {sections.map((section, index) => {
                  const isActive = index === activeSectionIndex;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSectionIndex(index)}
                      className={cn(
                        'inline-flex min-w-fit items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition-all',
                        isActive
                          ? surfaceMeta.chipClassName
                          : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white'
                      )}
                    >
                      <span>{index + 1}</span>
                      <span className="max-w-[9rem] truncate sm:max-w-[11rem]">{pick(language, section.label)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setActiveSectionIndex((current) => Math.max(0, current - 1))}
                  disabled={!canGoBack}
                  aria-label={language === 'es' ? 'Etapa anterior' : 'Previous stage'}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setActiveSectionIndex((current) => Math.min(sections.length - 1, current + 1))}
                  disabled={!canGoForward}
                  aria-label={language === 'es' ? 'Siguiente etapa' : 'Next stage'}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="w-full rounded-lg border border-white/10 bg-black/20 p-3 xl:w-[280px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                  {language === 'es' ? 'Progreso' : 'Progress'}
                </div>
                <div className="mt-1 text-sm font-black text-white">
                  {language === 'es' ? `Etapa ${activeSectionIndex + 1} de ${sections.length}` : `Stage ${activeSectionIndex + 1} of ${sections.length}`}
                </div>
              </div>
              <div className={cn('rounded-lg border px-3 py-1 text-sm font-black', surfaceMeta.chipClassName)}>
                {progressPercent}%
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r', {
                  'from-teal-400 to-teal-300': surface === 'learn',
                  'from-amber-400 to-orange-300': surface === 'labs',
                  'from-lime-400 to-emerald-300': surface === 'diagnose',
                })}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {modules.map((module, index) => {
            const Icon = module.icon;
            const itemLabel =
              surface === 'learn' && module.availableIn.includes('labs')
                ? language === 'es'
                  ? 'Curso + lab'
                  : 'Course + lab'
                : contentLabel;
            const state =
              index === 0
                ? {
                    label: language === 'es' ? 'Empieza aqui' : 'Start here',
                    badgeClass: surfaceMeta.chipClassName,
                    cardClass: 'border-white/15 bg-white/[0.08] shadow-[0_18px_42px_rgba(0,0,0,0.2)]',
                    buttonLabel:
                      surface === 'learn'
                        ? language === 'es'
                          ? 'Empezar curso'
                          : 'Start course'
                        : language === 'es'
                        ? 'Abrir'
                        : 'Open',
                  }
                : index === 1
                ? {
                    label: language === 'es' ? 'Despues' : 'Next',
                    badgeClass: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
                    cardClass: 'border-white/10 bg-black/20',
                    buttonLabel:
                      surface === 'learn'
                        ? language === 'es'
                          ? 'Ver siguiente curso'
                          : 'Open next course'
                        : language === 'es'
                        ? 'Ver siguiente'
                        : 'Open next',
                  }
                : {
                    label: language === 'es' ? 'Mas adelante' : 'Later',
                    badgeClass: 'border-white/10 bg-black/25 text-white/45',
                    cardClass: 'border-white/10 bg-black/15',
                    buttonLabel:
                      surface === 'learn'
                        ? language === 'es'
                          ? 'Abrir curso'
                          : 'Open course'
                        : language === 'es'
                        ? 'Abrir recurso'
                        : 'Open resource',
                  };

            return (
              <button
                key={module.id}
                onClick={() => openModule(module.id)}
                className={cn(
                  'flex min-h-[260px] flex-col rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]',
                  state.cardClass
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <Icon className={cn('h-6 w-6', module.color)} />
                  </div>
                  <span className={cn('rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]', state.badgeClass)}>
                    {state.label}
                  </span>
                </div>

                <div className="mt-5 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                    {itemLabel} {index + 1}
                  </div>
                  <h2 className="mt-2 text-xl font-black leading-tight text-white">{t(module.titleKey)}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/66">{pick(language, module.summary)}</p>
                </div>

                <div className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-sm font-black text-white transition-all hover:bg-white/[0.06]">
                  {state.buttonLabel}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel border border-white/10 p-4 sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
                  surfaceMeta.chipClassName
                )}
              >
                {language === 'es' ? 'Etapa' : 'Stage'} {activeSectionIndex + 1}
              </span>
              {activeSection.level ? (
                <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                  {language === 'es' ? 'Nivel' : 'Level'} {activeSection.level}
                </span>
              ) : null}
            </div>

            <h2 className="mt-4 text-2xl font-black text-white">{pick(language, activeSection.label)}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{pick(language, activeSection.description)}</p>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                  <Milestone className="h-4 w-4 text-teal-300" />
                  {surface === 'labs'
                    ? language === 'es'
                      ? 'Lo que entrenas'
                      : 'What you train'
                    : language === 'es'
                    ? 'Objetivo'
                    : 'Goal'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/68">{pick(language, activeSection.goal)}</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  {language === 'es' ? 'Cuando acabes' : 'When you finish'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/68">{pick(language, activeSection.outcome)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
              {language === 'es' ? 'Como recorrer esta etapa' : 'How to move through this stage'}
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                  {language === 'es' ? 'Empiezas por' : 'You start with'}
                </div>
                <div className="mt-2 text-base font-black text-white">{starterModule ? t(starterModule.titleKey) : '-'}</div>
                <p className="mt-2 text-sm leading-7 text-white/62">
                  {starterModule ? pick(language, starterModule.summary) : ''}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                  {language === 'es' ? 'Cierras con' : 'You close with'}
                </div>
                <div className="mt-2 text-base font-black text-white">{finisherModule ? t(finisherModule.titleKey) : '-'}</div>
                <p className="mt-2 text-sm leading-7 text-white/62">
                  {language === 'es'
                    ? 'Dentro de cada curso usas el contenido y el sidebar para avanzar sin volver a un indice duplicado.'
                    : 'Inside each course you use the content and sidebar to keep moving without returning to a duplicated index.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
