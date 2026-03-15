import { ArrowLeft, ArrowRight, Compass, Map, Milestone } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import {
  SURFACE_DEFINITIONS,
  SURFACE_GUIDES,
  SURFACE_SECTIONS,
  getModuleDefinition,
  getModuleStepIndex,
  getSectionForSurfaceModule,
  getSurfaceSequence,
  type ModuleId,
  type SurfaceId,
} from './moduleCatalog';

interface JourneyGuideProps {
  currentSurface: SurfaceId;
  currentModule: ModuleId;
  onModuleChange: (moduleId: ModuleId) => void;
  onBackToSurface: (surface: SurfaceId) => void;
}

function pick(language: 'en' | 'es', value: { en: string; es: string }) {
  return language === 'es' ? value.es : value.en;
}

export function JourneyGuide({
  currentSurface,
  currentModule,
  onModuleChange,
  onBackToSurface,
}: JourneyGuideProps) {
  const { language, t } = useLanguage();
  const guide = SURFACE_GUIDES[currentSurface];
  const sequence = getSurfaceSequence(currentSurface);
  const section = getSectionForSurfaceModule(currentSurface, currentModule);
  const currentModuleDefinition = getModuleDefinition(currentModule);

  if (!section || !currentModuleDefinition || sequence.length === 0) {
    return null;
  }

  const stepIndex = getModuleStepIndex(currentSurface, currentModule);
  const previousModule = stepIndex > 0 ? getModuleDefinition(sequence[stepIndex - 1]) : undefined;
  const nextModule = stepIndex >= 0 && stepIndex < sequence.length - 1 ? getModuleDefinition(sequence[stepIndex + 1]) : undefined;
  const surfaceMeta = SURFACE_DEFINITIONS[currentSurface];
  const currentSectionIndex = SURFACE_SECTIONS[currentSurface].findIndex((candidate) => candidate.id === section.id);
  const totalSections = SURFACE_SECTIONS[currentSurface].length;

  return (
    <section className="glass-panel border border-white/10 p-4 sm:p-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]',
                surfaceMeta.chipClassName
              )}
            >
              <Compass className="h-3.5 w-3.5" />
              {language === 'es' ? 'Ruta guiada activa' : 'Guided path active'}
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {language === 'es' ? 'Ahora toca:' : 'Now focus on:'} {t(currentModuleDefinition.titleKey)}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
              {pick(language, currentModuleDefinition.summary)}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/55">
              {pick(language, guide.coaching)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[360px] xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                {language === 'es' ? 'Paso actual' : 'Current step'}
              </div>
              <div className="mt-2 text-2xl font-black text-white">
                {stepIndex + 1}
                <span className="ml-1 text-sm text-white/45">/ {sequence.length}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                {language === 'es' ? 'Fase' : 'Phase'}
              </div>
              <div className="mt-2 text-sm font-black text-white">
                {currentSectionIndex + 1} / {totalSections}
              </div>
              <div className="mt-1 text-xs text-white/55">{pick(language, section.label)}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                {language === 'es' ? 'Lo que desbloquea' : 'What this unlocks'}
              </div>
              <div className="mt-2 text-xs leading-6 text-white/65">{pick(language, section.outcome)}</div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            {sequence.map((moduleId, index) => {
              const module = getModuleDefinition(moduleId);
              if (!module) return null;

              const isCurrent = moduleId === currentModule;
              const isPast = index < stepIndex;
              const isFuture = index > stepIndex;

              return (
                <button
                  key={`${currentSurface}-${moduleId}`}
                  onClick={() => onModuleChange(moduleId)}
                  className={cn(
                    'min-w-[180px] rounded-2xl border px-4 py-3 text-left transition-all',
                    isCurrent
                      ? 'border-white/15 bg-white/10 text-white'
                      : isPast
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-white/82'
                      : 'border-white/10 bg-black/20 text-white/62 hover:border-white/20 hover:bg-white/[0.05]'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                      0{index + 1}
                    </span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]',
                        isCurrent
                          ? surfaceMeta.chipClassName
                          : isPast
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                          : 'border-white/10 bg-black/30 text-white/38'
                      )}
                    >
                      {isCurrent ? (language === 'es' ? 'ahora' : 'now') : isPast ? 'ok' : language === 'es' ? 'luego' : 'later'}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-black text-white">{t(module.titleKey)}</div>
                  <p className={cn('mt-2 text-xs leading-6', isFuture ? 'text-white/45' : 'text-white/62')}>
                    {pick(language, module.summary)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
              <Milestone className="h-4 w-4 text-teal-300" />
              {language === 'es' ? 'Por que estas aqui' : 'Why you are here'}
            </div>
            <p className="mt-3 text-sm leading-7 text-white/74">{pick(language, section.goal)}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
              <Map className="h-4 w-4 text-amber-300" />
              {language === 'es' ? 'Que viene despues' : 'What comes next'}
            </div>
            <div className="mt-3 text-sm leading-7 text-white/74">
              {nextModule ? (
                <>
                  <div className="font-black text-white">{t(nextModule.titleKey)}</div>
                  <p className="mt-2">{pick(language, nextModule.summary)}</p>
                </>
              ) : (
                <p>{pick(language, section.outcome)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => onBackToSurface(currentSurface)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/72 transition-all hover:bg-white/10 hover:text-white"
          >
            <Map className="h-4 w-4" />
            {language === 'es' ? 'Volver al mapa de la ruta' : 'Back to route map'}
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            {previousModule ? (
              <button
                onClick={() => onModuleChange(previousModule.id)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/72 transition-all hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                {t(previousModule.titleKey)}
              </button>
            ) : null}

            {nextModule ? (
              <button
                onClick={() => onModuleChange(nextModule.id)}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition-all',
                  surfaceMeta.chipClassName,
                  'hover:brightness-110'
                )}
              >
                {stepIndex === sequence.length - 2 ? pick(language, guide.completeLabel) : pick(language, guide.continueLabel)}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
