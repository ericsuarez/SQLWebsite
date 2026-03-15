import { ArrowRight, BookOpen, Database, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ALL_MODULES,
  SURFACE_DEFINITIONS,
  SURFACE_SECTIONS,
  buildModulePath,
  getModuleDefinition,
  type SurfaceId,
} from '../Layout/moduleCatalog';
import { cn } from '../../lib/utils';

function pick(language: 'en' | 'es', value: { en: string; es: string }) {
  return language === 'es' ? value.es : value.en;
}

export function SurfaceHubPage({ surface }: { surface: SurfaceId }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const surfaceMeta = SURFACE_DEFINITIONS[surface];
  const sections = SURFACE_SECTIONS[surface];
  const featuredModules = ALL_MODULES.filter((module) => module.availableIn.includes(surface)).slice(0, 3);

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_34%)]" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_320px]">
          <div>
            <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]', surfaceMeta.chipClassName)}>
              <surfaceMeta.icon className="h-3.5 w-3.5" />
              {pick(language, surfaceMeta.kicker)}
            </div>
            <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">{pick(language, surfaceMeta.title)}</h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/74 sm:text-base">
              {pick(language, surfaceMeta.description)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
              {language === 'es' ? 'Acceso rápido' : 'Quick access'}
            </div>
            <div className="mt-4 space-y-3">
              {featuredModules.map((module) => (
                <button
                  key={`${surface}-featured-${module.id}`}
                  onClick={() => navigate(buildModulePath(surface, module.id, { view: module.defaultSubview, mode: module.defaultMode }))}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-black text-white">{t(module.titleKey)}</div>
                    <div className="mt-1 text-xs text-white/55">{pick(language, module.summary)}</div>
                  </div>
                  <ArrowRight className="ml-4 h-4 w-4 shrink-0 text-white/45" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {surface === 'learn' ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {sections.map((section) => (
            <div key={section.id} className="glass-panel border border-white/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                    {pick(language, section.label)}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/68">{pick(language, section.description)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">XP</div>
                  <div className="text-xl font-black text-white">{section.xp ?? 0}</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {section.moduleIds.map((moduleId) => {
                  const module = getModuleDefinition(moduleId);
                  if (!module) return null;

                  return (
                    <button
                      key={`${section.id}-${module.id}`}
                      onClick={() => navigate(buildModulePath('learn', module.id, { view: module.defaultSubview, mode: module.defaultMode }))}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-black text-white">{t(module.titleKey)}</div>
                        <ArrowRight className="h-4 w-4 text-white/45" />
                      </div>
                      <p className="mt-2 text-sm leading-7 text-white/65">{pick(language, module.summary)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="glass-panel border border-white/10 p-5">
              <div className="max-w-3xl">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">{pick(language, section.label)}</div>
                <p className="mt-2 text-sm leading-7 text-white/68">{pick(language, section.description)}</p>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {section.moduleIds.map((moduleId) => {
                  const module = getModuleDefinition(moduleId);
                  if (!module) return null;
                  const Icon = module.icon;

                  return (
                    <button
                      key={`${section.id}-${module.id}`}
                      onClick={() => navigate(buildModulePath(surface, module.id, { view: module.defaultSubview, mode: module.defaultMode }))}
                      className="rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <Icon className={cn('h-5 w-5', module.color)} />
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/40" />
                      </div>
                      <h3 className="mt-4 text-lg font-black text-white">{t(module.titleKey)}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/68">{pick(language, module.summary)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="glass-panel border border-white/10 p-5">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
            <BookOpen className="h-4 w-4 text-teal-300" />
            {language === 'es' ? 'Cómo encaja con el resto' : 'How this fits the rest'}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                title: language === 'es' ? 'Aprende' : 'Learn',
                body:
                  language === 'es'
                    ? 'Da contexto y orden antes de abrir las herramientas avanzadas.'
                    : 'Provides order and context before the advanced tooling.',
              },
              {
                title: language === 'es' ? 'Practica' : 'Practice',
                body:
                  language === 'es'
                    ? 'Abre las vistas play y los drills guiados sin duplicar contenido.'
                    : 'Opens play views and guided drills without duplicating content.',
              },
              {
                title: language === 'es' ? 'Diagnostica' : 'Diagnose',
                body:
                  language === 'es'
                    ? 'Sirve al DBA que necesita queries, evidencia y runbooks ya.'
                    : 'Serves the DBA who needs queries, evidence, and runbooks now.',
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
            <Database className="h-4 w-4 text-cyan-300" />
            {language === 'es' ? 'Modo experto' : 'Expert mode'}
          </div>
          <p className="mt-3 text-sm leading-7 text-white/68">
            {language === 'es'
              ? 'Si ya sabes a dónde quieres ir, entra a la biblioteca técnica y salta al módulo concreto.'
              : 'If you already know where you need to go, open the technical library and jump straight to the module.'}
          </p>
          <button
            onClick={() => navigate('/library')}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/12 px-5 py-3 text-sm font-black text-cyan-100 transition-all hover:bg-cyan-500/20"
          >
            <Star className="h-4 w-4" />
            {language === 'es' ? 'Ir a biblioteca técnica' : 'Go to technical library'}
          </button>
        </div>
      </div>
    </div>
  );
}
