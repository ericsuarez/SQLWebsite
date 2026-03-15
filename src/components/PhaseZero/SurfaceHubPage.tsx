import { ArrowRight, BookOpen, Compass, Database, Milestone, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { AcademyLabsOverview } from './AcademyLabsOverview';
import {
  SURFACE_DEFINITIONS,
  SURFACE_GUIDES,
  SURFACE_SECTIONS,
  buildModulePath,
  getModuleDefinition,
  getSurfaceSequence,
  type SurfaceId,
} from '../Layout/moduleCatalog';
import { cn } from '../../lib/utils';

function pick(language: 'en' | 'es', value: { en: string; es: string }) {
  return language === 'es' ? value.es : value.en;
}

export function SurfaceHubPage({ surface }: { surface: SurfaceId }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  if (surface === 'learn' || surface === 'labs') {
    return <AcademyLabsOverview focusSurface={surface} />;
  }

  const surfaceMeta = SURFACE_DEFINITIONS[surface];
  const sections = SURFACE_SECTIONS[surface];
  const sequence = getSurfaceSequence(surface);
  const firstModule = sequence.length > 0 ? getModuleDefinition(sequence[0]) : undefined;
  const guide = surface === 'library' ? null : SURFACE_GUIDES[surface];

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_34%)]" />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_340px]">
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
              {pick(language, surfaceMeta.title)}
            </h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/74 sm:text-base">
              {pick(language, surfaceMeta.description)}
            </p>

            {guide ? (
              <>
                <div className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                  {language === 'es' ? 'Como recorrer esta superficie' : 'How to move through this surface'}
                </div>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-white/64">{pick(language, guide.intro)}</p>
              </>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            {guide && firstModule ? (
              <>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                  <Compass className="h-4 w-4 text-teal-300" />
                  {language === 'es' ? 'Inicio recomendado' : 'Recommended start'}
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                    {language === 'es' ? 'Empieza aqui' : 'Start here'}
                  </div>
                  <div className="mt-2 text-lg font-black text-white">{t(firstModule.titleKey)}</div>
                  <p className="mt-2 text-sm leading-7 text-white/64">{pick(language, firstModule.summary)}</p>
                </div>

                <div className="mt-4 space-y-3">
                  {sections.map((section, index) => {
                    const starter = getModuleDefinition(section.moduleIds[0]);
                    if (!starter) return null;

                    return (
                      <button
                        key={`${surface}-starter-${section.id}`}
                        onClick={() =>
                          navigate(
                            buildModulePath(surface, starter.id, {
                              view: starter.defaultSubview,
                              mode: starter.defaultMode,
                            })
                          )
                        }
                        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
                            {language === 'es' ? 'Fase' : 'Phase'} {index + 1}
                          </div>
                          <div className="mt-1 text-sm font-black text-white">{pick(language, section.label)}</div>
                          <div className="mt-1 truncate text-xs text-white/52">{t(starter.titleKey)}</div>
                        </div>
                        <ArrowRight className="ml-4 h-4 w-4 shrink-0 text-white/40" />
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    navigate(
                      buildModulePath(surface, firstModule.id, {
                        view: firstModule.defaultSubview,
                        mode: firstModule.defaultMode,
                      })
                    )
                  }
                  className={cn(
                    'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition-all hover:brightness-110',
                    surfaceMeta.chipClassName
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  {pick(language, guide.startLabel)}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                  <Database className="h-4 w-4 text-cyan-300" />
                  {language === 'es' ? 'Modo experto' : 'Expert mode'}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/68">
                  {language === 'es'
                    ? 'Aqui no intentamos guiarte paso a paso. Esta vista existe para quien ya sabe lo que busca y quiere entrar directo al modulo concreto.'
                    : 'This view is not trying to guide you step by step. It exists for the person who already knows what they need and wants direct access to the module.'}
                </p>
                <div className="mt-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm leading-7 text-white/76">
                  {language === 'es'
                    ? 'Usa Library cuando el orden ya no te aporte valor y te importe mas la velocidad.'
                    : 'Use Library when sequence matters less than speed.'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="glass-panel border border-white/10 p-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_320px]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
                      surfaceMeta.chipClassName
                    )}
                  >
                    {language === 'es' ? 'Fase' : 'Phase'} {sectionIndex + 1}
                  </span>
                  {'xp' in section && section.xp ? (
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      XP {section.xp}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 text-2xl font-black text-white">{pick(language, section.label)}</h2>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-white/70">{pick(language, section.description)}</p>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                      <Milestone className="h-4 w-4 text-teal-300" />
                      {language === 'es' ? 'Objetivo' : 'Goal'}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/70">{pick(language, section.goal)}</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                      <BookOpen className="h-4 w-4 text-amber-300" />
                      {language === 'es' ? 'Cuando termines' : 'When you finish'}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/70">{pick(language, section.outcome)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
                  {language === 'es' ? 'Orden recomendado' : 'Recommended order'}
                </div>
                <div className="mt-4 space-y-3">
                  {section.moduleIds.map((moduleId, moduleIndex) => {
                    const module = getModuleDefinition(moduleId);
                    if (!module) return null;
                    const Icon = module.icon;

                    return (
                      <button
                        key={`${section.id}-${module.id}`}
                        onClick={() =>
                          navigate(
                            buildModulePath(surface, module.id, {
                              view: module.defaultSubview,
                              mode: module.defaultMode,
                            })
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs font-black text-white/70">
                            0{moduleIndex + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className={cn('h-4 w-4', module.color)} />
                              <span className="truncate text-sm font-black text-white">{t(module.titleKey)}</span>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-white/65">{pick(language, module.summary)}</p>
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/40" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="glass-panel border border-white/10 p-5">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
            <BookOpen className="h-4 w-4 text-teal-300" />
            {language === 'es' ? 'Como encaja con el resto' : 'How this fits the rest'}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                title: language === 'es' ? 'Aprende' : 'Learn',
                body:
                  language === 'es'
                    ? 'Construye contexto antes de abrir la herramienta mas avanzada.'
                    : 'Build context before opening the most advanced tool.',
              },
              {
                title: language === 'es' ? 'Practica' : 'Practice',
                body:
                  language === 'es'
                    ? 'Convierte teoria en reflejo viendo que pasa y en que orden pasa.'
                    : 'Turn theory into instinct by watching what happens and in what order.',
              },
              {
                title: language === 'es' ? 'Diagnostica' : 'Diagnose',
                body:
                  language === 'es'
                    ? 'Salta al triage y la evidencia cuando la incidencia ya existe.'
                    : 'Jump into triage and evidence when the incident already exists.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-black text-white">{card.title}</div>
                <p className="mt-2 text-sm leading-7 text-white/65">{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel border border-white/10 p-5">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
            <Star className="h-4 w-4 text-cyan-300" />
            {language === 'es' ? 'Modo experto' : 'Expert mode'}
          </div>
          <p className="mt-3 text-sm leading-7 text-white/68">
            {language === 'es'
              ? 'Si ya sabes a donde quieres ir, Library sigue estando disponible como acceso rapido, pero ya no manda sobre el recorrido principal.'
              : 'If you already know where to go, Library is still available as quick access, but it no longer dominates the main journey.'}
          </p>
          <button
            onClick={() => navigate('/library')}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/12 px-5 py-3 text-sm font-black text-cyan-100 transition-all hover:bg-cyan-500/20"
          >
            <Star className="h-4 w-4" />
            {language === 'es' ? 'Ir a biblioteca tecnica' : 'Go to technical library'}
          </button>
        </div>
      </div>
    </div>
  );
}
