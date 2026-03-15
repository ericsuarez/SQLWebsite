import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, Milestone, PlayCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import {
  SURFACE_DEFINITIONS,
  SURFACE_GUIDES,
  SURFACE_SECTIONS,
  buildModulePath,
  getModuleDefinition,
  type SurfaceId,
} from '../Layout/moduleCatalog';

function pick<T>(language: 'en' | 'es', value: { en: T; es: T }) {
  return language === 'es' ? value.es : value.en;
}

const SURFACE_PLAYBOOK = {
  learn: {
    title: {
      en: 'Academy track',
      es: 'Track de academia',
    },
    subtitle: {
      en: 'Start from the engine core and move forward in a clean order.',
      es: 'Empieza por el core del motor y avanza con un orden limpio.',
    },
    bullets: {
      en: [
        'You begin with architecture, storage, memory, and execution.',
        'Then you move into waits, counters, indexes, and host behavior.',
        'You finish with deep internals such as log, TempDB, replication, and HA.',
      ],
      es: [
        'Empiezas por arquitectura, storage, memoria y ejecución.',
        'Luego pasas a waits, contadores, índices y comportamiento del host.',
        'Cierras con internals profundos como log, TempDB, replicación y HA.',
      ],
    },
    button: {
      en: 'Open current stage',
      es: 'Abrir etapa actual',
    },
  },
  labs: {
    title: {
      en: 'Practice track',
      es: 'Track de práctica',
    },
    subtitle: {
      en: 'Train the DBA instinct by following symptoms, evidence, and next moves.',
      es: 'Entrena el instinto DBA siguiendo síntomas, evidencia y siguiente movimiento.',
    },
    bullets: {
      en: [
        'Every block starts from a symptom, not from the fix.',
        'The play view should show what the engine is doing under pressure.',
        'You use the lab to decide what a DBA would do next and why.',
      ],
      es: [
        'Cada bloque empieza por un síntoma, no por el fix.',
        'La vista play te enseña qué está haciendo el motor bajo presión.',
        'Usas el lab para decidir qué haría un DBA después y por qué.',
      ],
    },
    button: {
      en: 'Open current lab block',
      es: 'Abrir bloque actual',
    },
  },
  diagnose: {
    title: {
      en: 'Diagnosis track',
      es: 'Track de diagnóstico',
    },
    subtitle: {
      en: 'Jump into triage, capture evidence, and close with safe operational response.',
      es: 'Entra a triage, captura evidencia y cierra con respuesta operativa segura.',
    },
    bullets: {
      en: [
        'Run the minimum proof first to reduce noise.',
        'Capture evidence before the signal disappears.',
        'Turn diagnosis into response instead of improvising under pressure.',
      ],
      es: [
        'Lanza primero la prueba mínima para reducir ruido.',
        'Captura evidencia antes de que desaparezca la señal.',
        'Convierte el diagnóstico en respuesta en lugar de improvisar bajo presión.',
      ],
    },
    button: {
      en: 'Open current response block',
      es: 'Abrir bloque actual',
    },
  },
} as const;

export function SurfaceHubPage({ surface }: { surface: SurfaceId }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const surfaceMeta = SURFACE_DEFINITIONS[surface];
  const surfaceGuide = SURFACE_GUIDES[surface];
  const sections = SURFACE_SECTIONS[surface];
  const profile = SURFACE_PLAYBOOK[surface];
  const bullets = profile.bullets[language];
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

  return (
    <div className="flex min-h-full flex-col gap-5">
      <section className="glass-panel relative overflow-hidden border border-white/10 p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.08),transparent_26%)]" />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="max-w-4xl">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]',
                surfaceMeta.chipClassName
              )}
            >
              <surfaceMeta.icon className="h-3.5 w-3.5" />
              {pick(language, surfaceMeta.kicker)}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {pick(language, profile.title)}
            </h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/74 sm:text-base">
              {pick(language, profile.subtitle)}
            </p>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/58">{pick(language, surfaceGuide.coaching)}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {bullets.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-black text-white">{pick(language, profile.title)}</div>
                <div className="mt-1 text-sm text-white/55">{pick(language, activeSection.label)}</div>
              </div>
              <div className={cn('rounded-full border px-3 py-1 text-sm font-black', surfaceMeta.chipClassName)}>
                {progressPercent}%
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r', {
                  'from-teal-400 to-teal-300': surface === 'learn',
                  'from-amber-400 to-orange-300': surface === 'labs',
                  'from-lime-400 to-emerald-300': surface === 'diagnose',
                })}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                {language === 'es' ? 'Ahora toca' : 'Current stage'}
              </div>
              <p className="mt-2 text-sm leading-7 text-white/70">{pick(language, activeSection.goal)}</p>
            </div>

            {starterModule ? (
              <button
                onClick={() =>
                  navigate(
                    buildModulePath(surface, starterModule.id, {
                      view: starterModule.defaultSubview,
                      mode: starterModule.defaultMode,
                    })
                  )
                }
                className={cn(
                  'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition-all hover:brightness-110',
                  surfaceMeta.chipClassName
                )}
              >
                <PlayCircle className="h-4 w-4" />
                {pick(language, profile.button)}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="glass-panel border border-white/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
              <Compass className="h-4 w-4 text-teal-300" />
              {language === 'es' ? 'Etapas del recorrido' : 'Track stages'}
            </div>
            <p className="mt-2 text-sm leading-7 text-white/62">{pick(language, surfaceGuide.intro)}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveSectionIndex((current) => Math.max(0, current - 1))}
              disabled={!canGoBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              {language === 'es' ? 'Anterior etapa' : 'Previous stage'}
            </button>

            <button
              onClick={() => setActiveSectionIndex((current) => Math.min(sections.length - 1, current + 1))}
              disabled={!canGoForward}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {language === 'es' ? 'Siguiente etapa' : 'Next stage'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-3">
          {sections.map((section, index) => {
            const isActive = index === activeSectionIndex;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionIndex(index)}
                className={cn(
                  'rounded-3xl border p-4 text-left transition-all',
                  isActive
                    ? 'border-white/15 bg-white/[0.08] text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)]'
                    : 'border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/[0.05]'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/25 text-xs font-black text-white/70">
                    0{index + 1}
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]',
                      isActive ? surfaceMeta.chipClassName : 'border-white/10 bg-black/25 text-white/40'
                    )}
                  >
                    {section.level
                      ? `${language === 'es' ? 'Nivel' : 'Level'} ${section.level}`
                      : `${section.moduleIds.length} ${language === 'es' ? 'mód.' : 'mods.'}`}
                  </span>
                </div>

                <div className="mt-4 text-lg font-black text-white">{pick(language, section.label)}</div>
                <p className="mt-2 text-sm leading-7 text-white/62">{pick(language, section.description)}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel border border-white/10 p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
                  surfaceMeta.chipClassName
                )}
              >
                {language === 'es' ? 'Etapa' : 'Stage'} {activeSectionIndex + 1}
              </span>
              {activeSection.level ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                  {language === 'es' ? 'Nivel' : 'Level'} {activeSection.level}
                </span>
              ) : null}
              {activeSection.xp ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                  XP {activeSection.xp}
                </span>
              ) : null}
            </div>

            <h2 className="mt-4 text-2xl font-black text-white">{pick(language, activeSection.label)}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{pick(language, activeSection.description)}</p>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
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

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  {language === 'es' ? 'Cuando acabes' : 'When you finish'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/68">{pick(language, activeSection.outcome)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
              {language === 'es' ? 'Cómo recorrer esta etapa' : 'How to move through this stage'}
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                  {language === 'es' ? 'Empiezas por' : 'You start with'}
                </div>
                <div className="mt-2 text-base font-black text-white">{starterModule ? t(starterModule.titleKey) : '-'}</div>
                <p className="mt-2 text-sm leading-7 text-white/62">
                  {starterModule ? pick(language, starterModule.summary) : ''}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                  {language === 'es' ? 'Cierras con' : 'You close with'}
                </div>
                <div className="mt-2 text-base font-black text-white">{finisherModule ? t(finisherModule.titleKey) : '-'}</div>
                <p className="mt-2 text-sm leading-7 text-white/62">
                  {language === 'es'
                    ? 'Dentro del módulo usas el contenido y el sidebar para seguir el orden sin tener que volver a leer un índice duplicado.'
                    : 'Inside the module you use the content and the sidebar to keep moving without reading a duplicated index.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {modules.map((module, index) => {
          const Icon = module.icon;
          const state =
            index === 0
              ? {
                  label: language === 'es' ? 'Empieza aquí' : 'Start here',
                  badgeClass: surfaceMeta.chipClassName,
                  cardClass: 'border-white/15 bg-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.22)]',
                  buttonLabel: language === 'es' ? 'Empezar módulo' : 'Start module',
                }
              : index === 1
              ? {
                  label: language === 'es' ? 'Después' : 'Next up',
                  badgeClass: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
                  cardClass: 'border-white/10 bg-black/20',
                  buttonLabel: language === 'es' ? 'Ver siguiente módulo' : 'Open next module',
                }
              : {
                  label: language === 'es' ? 'Más adelante' : 'Later on',
                  badgeClass: 'border-white/10 bg-black/25 text-white/45',
                  cardClass: 'border-white/10 bg-black/15',
                  buttonLabel: language === 'es' ? 'Abrir módulo' : 'Open module',
                };

          return (
            <button
              key={module.id}
              onClick={() =>
                navigate(
                  buildModulePath(surface, module.id, {
                    view: module.defaultSubview,
                    mode: module.defaultMode,
                  })
                )
              }
              className={cn(
                'rounded-[1.75rem] border p-5 text-left transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]',
                state.cardClass
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  <Icon className={cn('h-6 w-6', module.color)} />
                </div>
                <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]', state.badgeClass)}>
                  {state.label}
                </span>
              </div>

              <div className="mt-6">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                  {language === 'es' ? 'Módulo' : 'Module'} 0{index + 1}
                </div>
                <h3 className="mt-2 text-2xl font-black text-white">{t(module.titleKey)}</h3>
                <p className="mt-3 text-sm leading-7 text-white/66">{pick(language, module.summary)}</p>
              </div>

              <div className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-black text-white transition-all hover:bg-white/[0.06]">
                {state.buttonLabel}
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
