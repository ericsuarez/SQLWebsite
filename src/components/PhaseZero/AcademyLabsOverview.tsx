import {
  ArrowRight,
  BookOpen,
  Compass,
  Database,
  FlaskConical,
  HardDrive,
  Milestone,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import {
  SURFACE_DEFINITIONS,
  SURFACE_GUIDES,
  SURFACE_SECTIONS,
  buildModulePath,
  getModuleDefinition,
  getSurfaceSequence,
} from '../Layout/moduleCatalog';

type FocusSurface = 'learn' | 'labs';

function pick(language: 'en' | 'es', value: { en: string; es: string }) {
  return language === 'es' ? value.es : value.en;
}

function sectionVisual(sectionId: string) {
  if (sectionId === 'level-1') {
    return {
      icon: Database,
      glow: 'from-teal-500/16 via-transparent to-transparent',
      chip: 'border-teal-500/25 bg-teal-500/10 text-teal-200',
      panel: 'border-teal-500/20 bg-teal-500/10',
      text: 'text-teal-300',
    };
  }

  if (sectionId === 'level-2') {
    return {
      icon: BookOpen,
      glow: 'from-amber-500/14 via-transparent to-transparent',
      chip: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
      panel: 'border-amber-500/20 bg-amber-500/10',
      text: 'text-amber-300',
    };
  }

  if (sectionId === 'level-3') {
    return {
      icon: HardDrive,
      glow: 'from-lime-500/14 via-transparent to-transparent',
      chip: 'border-lime-500/25 bg-lime-500/10 text-lime-200',
      panel: 'border-lime-500/20 bg-lime-500/10',
      text: 'text-lime-300',
    };
  }

  if (sectionId === 'guided-incidents') {
    return {
      icon: Compass,
      glow: 'from-amber-500/14 via-transparent to-transparent',
      chip: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
      panel: 'border-amber-500/20 bg-amber-500/10',
      text: 'text-amber-300',
    };
  }

  if (sectionId === 'engine-labs') {
    return {
      icon: FlaskConical,
      glow: 'from-rose-500/14 via-transparent to-transparent',
      chip: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
      panel: 'border-rose-500/20 bg-rose-500/10',
      text: 'text-rose-300',
    };
  }

  return {
    icon: Wrench,
    glow: 'from-cyan-500/14 via-transparent to-transparent',
    chip: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200',
    panel: 'border-cyan-500/20 bg-cyan-500/10',
    text: 'text-cyan-300',
  };
}

export function AcademyLabsOverview({ focusSurface }: { focusSurface: FocusSurface }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const learnGuide = SURFACE_GUIDES.learn;
  const labsGuide = SURFACE_GUIDES.labs;
  const learnSections = SURFACE_SECTIONS.learn;
  const labsSections = SURFACE_SECTIONS.labs;
  const learnStarter = getModuleDefinition(getSurfaceSequence('learn')[0]);
  const labsStarter = getModuleDefinition(getSurfaceSequence('labs')[0]);

  const cards = [
    {
      surface: 'learn' as const,
      title: {
        en: 'Academy',
        es: 'Academia',
      },
      lead: learnGuide.intro,
      action: learnGuide.startLabel,
      starter: learnStarter,
      meta: SURFACE_DEFINITIONS.learn,
      accent: focusSurface === 'learn',
      bullets:
        language === 'es'
          ? ['Fundamentos del motor', 'Rendimiento y diseno', 'Internals avanzados']
          : ['Engine fundamentals', 'Performance and design', 'Advanced internals'],
    },
    {
      surface: 'labs' as const,
      title: {
        en: 'Labs',
        es: 'Labs',
      },
      lead: labsGuide.intro,
      action: labsGuide.startLabel,
      starter: labsStarter,
      meta: SURFACE_DEFINITIONS.labs,
      accent: focusSurface === 'labs',
      bullets:
        language === 'es'
          ? ['Incidencias guiadas', 'Internals de motor', 'Practica DBA']
          : ['Guided incidents', 'Engine internals', 'DBA practice'],
    },
  ];

  return (
    <div className="flex min-h-full flex-col gap-5">
      <section className="glass-panel relative overflow-hidden border border-white/10 p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(132,204,22,0.1),transparent_26%)]" />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_360px]">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/72">
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              {language === 'es' ? 'Academia y Labs' : 'Academy and Labs'}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {language === 'es'
                ? 'Una entrada visual para aprender y practicar sin perderte'
                : 'A visual entry point to learn and practice without getting lost'}
            </h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/74 sm:text-base">
              {language === 'es'
                ? 'Primero entiende el motor. Luego mira como se rompe, como reacciona y que haria un DBA. Aqui ves los modulos ya agrupados por secciones para no depender de ir saltando entre pestanas.'
                : 'Understand the engine first. Then watch how it breaks, reacts, and how a DBA would handle it. The modules are grouped by section so you do not depend on tab hopping to see the whole path.'}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
              {language === 'es' ? 'Como usar este tablero' : 'How to use this board'}
            </div>
            <div className="mt-4 space-y-3">
              {[
                {
                  title: language === 'es' ? '1. Empieza por Academia' : '1. Start with Academy',
                  body:
                    language === 'es'
                      ? 'Construye base mental antes de tocar triage o labs mas duros.'
                      : 'Build the mental model before opening the heavier labs.',
                },
                {
                  title: language === 'es' ? '2. Baja a Labs' : '2. Move into Labs',
                  body:
                    language === 'es'
                      ? 'Convierte teoria en reflejo viendo sintomas, evidencia y siguiente paso.'
                      : 'Turn theory into instinct by watching symptoms, evidence, and next steps.',
                },
                {
                  title: language === 'es' ? '3. Usa Diagnose cuando duela de verdad' : '3. Use Diagnose when it actually hurts',
                  body:
                    language === 'es'
                      ? 'Cuando ya hay incidencia, entra al toolkit operativo.'
                      : 'When an incident is already live, jump into the operational toolkit.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-sm font-black text-white">{item.title}</div>
                  <div className="mt-2 text-sm leading-7 text-white/64">{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {cards.map((card) => (
          (() => {
            const starter = card.starter;

            return (
              <div
                key={card.surface}
                className={cn(
                  'glass-panel relative overflow-hidden border p-5 sm:p-6',
                  card.accent ? 'border-white/12 shadow-[0_18px_60px_rgba(0,0,0,0.22)]' : 'border-white/10'
                )}
              >
                <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100', card.surface === 'learn' ? 'from-teal-500/12 via-transparent to-transparent' : 'from-amber-500/12 via-transparent to-transparent')} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]', card.meta.chipClassName)}>
                        <card.meta.icon className="h-3.5 w-3.5" />
                        {pick(language, card.meta.kicker)}
                      </div>
                      <h2 className="mt-4 text-2xl font-black text-white">{pick(language, card.title)}</h2>
                    </div>
                    <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]', card.meta.chipClassName)}>
                      {card.surface === focusSurface
                        ? language === 'es'
                          ? 'foco actual'
                          : 'current focus'
                        : language === 'es'
                        ? 'ruta'
                        : 'route'}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-white/68">{pick(language, card.lead)}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {card.bullets.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white/78">
                        {item}
                      </div>
                    ))}
                  </div>

                  {starter ? (
                    <button
                      onClick={() =>
                        navigate(
                          buildModulePath(card.surface, starter.id, {
                            view: starter.defaultSubview,
                            mode: starter.defaultMode,
                          })
                        )
                      }
                      className={cn(
                        'mt-5 inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition-all hover:brightness-110',
                        card.meta.chipClassName
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      {pick(language, card.action)}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })()
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-teal-500/25 bg-teal-500/10 p-3">
              <BookOpen className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                {language === 'es' ? 'Ruta visual' : 'Visual route'}
              </div>
              <div className="text-2xl font-black text-white">{language === 'es' ? 'Academia' : 'Academy'}</div>
            </div>
          </div>

          {learnSections.map((section, sectionIndex) => {
            const visual = sectionVisual(section.id);
            const Icon = visual.icon;

            return (
              <div key={`learn-${section.id}`} className="glass-panel relative overflow-hidden border border-white/10 p-5">
                <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', visual.glow)} />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]', visual.chip)}>
                      {language === 'es' ? 'Seccion' : 'Section'} {sectionIndex + 1}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      XP {section.xp}
                    </span>
                  </div>

                  <div className="mt-4 flex items-start gap-4">
                    <div className={cn('rounded-2xl border p-3', visual.panel)}>
                      <Icon className={cn('h-5 w-5', visual.text)} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black text-white">{pick(language, section.label)}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/68">{pick(language, section.description)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                        <Milestone className={cn('h-4 w-4', visual.text)} />
                        {language === 'es' ? 'Objetivo' : 'Goal'}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/68">{pick(language, section.goal)}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                        {language === 'es' ? 'Cuando termines' : 'When you finish'}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/68">{pick(language, section.outcome)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {section.moduleIds.map((moduleId, moduleIndex) => {
                      const module = getModuleDefinition(moduleId);
                      if (!module) return null;
                      const ModuleIcon = module.icon;

                      return (
                        <button
                          key={`learn-${section.id}-${module.id}`}
                          onClick={() =>
                            navigate(
                              buildModulePath('learn', module.id, {
                                view: module.defaultSubview,
                                mode: module.defaultMode,
                              })
                            )
                          }
                          className="rounded-3xl border border-white/10 bg-black/25 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs font-black text-white/70">
                              0{moduleIndex + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <ModuleIcon className={cn('h-4 w-4', module.color)} />
                                <span className="truncate text-sm font-black text-white">{t(module.titleKey)}</span>
                              </div>
                              <p className="mt-2 text-sm leading-7 text-white/62">{pick(language, module.summary)}</p>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/40" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3">
              <FlaskConical className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                {language === 'es' ? 'Practica visual' : 'Visual practice'}
              </div>
              <div className="text-2xl font-black text-white">Labs</div>
            </div>
          </div>

          {labsSections.map((section, sectionIndex) => {
            const visual = sectionVisual(section.id);
            const Icon = visual.icon;

            return (
              <div key={`labs-${section.id}`} className="glass-panel relative overflow-hidden border border-white/10 p-5">
                <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', visual.glow)} />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]', visual.chip)}>
                      {language === 'es' ? 'Bloque' : 'Block'} {sectionIndex + 1}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      {section.moduleIds.length} {language === 'es' ? 'modulos' : 'modules'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-start gap-4">
                    <div className={cn('rounded-2xl border p-3', visual.panel)}>
                      <Icon className={cn('h-5 w-5', visual.text)} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black text-white">{pick(language, section.label)}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/68">{pick(language, section.description)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                        <Milestone className={cn('h-4 w-4', visual.text)} />
                        {language === 'es' ? 'Lo que entrenas' : 'What you train'}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/68">{pick(language, section.goal)}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                        {language === 'es' ? 'Lo que te llevas' : 'What you take away'}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/68">{pick(language, section.outcome)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {section.moduleIds.map((moduleId, moduleIndex) => {
                      const module = getModuleDefinition(moduleId);
                      if (!module) return null;
                      const ModuleIcon = module.icon;

                      return (
                        <button
                          key={`labs-${section.id}-${module.id}`}
                          onClick={() =>
                            navigate(
                              buildModulePath('labs', module.id, {
                                view: module.defaultSubview,
                                mode: module.defaultMode,
                              })
                            )
                          }
                          className="rounded-3xl border border-white/10 bg-black/25 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs font-black text-white/70">
                              0{moduleIndex + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <ModuleIcon className={cn('h-4 w-4', module.color)} />
                                <span className="truncate text-sm font-black text-white">{t(module.titleKey)}</span>
                              </div>
                              <p className="mt-2 text-sm leading-7 text-white/62">{pick(language, module.summary)}</p>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/40" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
