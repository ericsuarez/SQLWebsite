import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  Brain,
  GitBranch,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  MODERN_FEATURE_DEFINITIONS,
  MODERN_FEATURE_RELEASES,
  type ModernFeatureDefinition,
  type ModernFeatureRelease,
  type ModernFeatureTone,
} from '../../data/modernFeaturesData';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const ICONS: Record<string, typeof Sparkles> = {
  Archive,
  Brain,
  GitBranch,
  RotateCcw,
  Sparkles,
  Zap,
};

const FEATURE_STYLES: Record<
  ModernFeatureTone,
  {
    border: string;
    bg: string;
    text: string;
    chip: string;
    glow: string;
    accent: 'emerald' | 'amber' | 'blue' | 'violet' | 'rose' | 'cyan';
  }
> = {
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    chip: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.10)]',
    accent: 'emerald',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
    chip: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.10)]',
    accent: 'blue',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    chip: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.10)]',
    accent: 'amber',
  },
  cyan: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    chip: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
    glow: 'shadow-[0_0_30px_rgba(34,211,238,0.10)]',
    accent: 'cyan',
  },
  lime: {
    border: 'border-lime-500/30',
    bg: 'bg-lime-500/10',
    text: 'text-lime-300',
    chip: 'border-lime-500/20 bg-lime-500/10 text-lime-200',
    glow: 'shadow-[0_0_30px_rgba(163,230,53,0.10)]',
    accent: 'emerald',
  },
  rose: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    chip: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.10)]',
    accent: 'rose',
  },
};

function pick(language: 'en' | 'es', value: { en: string; es: string }) {
  return language === 'es' ? value.es : value.en;
}

function metricDelta(metric: ModernFeatureDefinition['metrics'][number]) {
  if (metric.preference === 'lower') {
    return Math.max(0, metric.before - metric.after);
  }
  return Math.max(0, metric.after - metric.before);
}

function stageDotPosition(length: number, index: number) {
  if (length <= 1) {
    return '50%';
  }

  return `${((index + 0.5) / length) * 100}%`;
}

type ReleaseFilter = 'all' | ModernFeatureRelease;

export function ModernFeatures() {
  const { t, language } = useLanguage();
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all');
  const [selectedFeatureId, setSelectedFeatureId] = useState(MODERN_FEATURE_DEFINITIONS[0]?.id ?? 'adr');
  const [stageIndex, setStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const filteredFeatures = useMemo(() => {
    if (releaseFilter === 'all') {
      return MODERN_FEATURE_DEFINITIONS;
    }

    return MODERN_FEATURE_DEFINITIONS.filter((feature) => feature.release === releaseFilter);
  }, [releaseFilter]);

  useEffect(() => {
    if (filteredFeatures.some((feature) => feature.id === selectedFeatureId)) {
      return;
    }

    setSelectedFeatureId(filteredFeatures[0]?.id ?? MODERN_FEATURE_DEFINITIONS[0]?.id ?? 'adr');
  }, [filteredFeatures, selectedFeatureId]);

  const selectedFeature =
    filteredFeatures.find((feature) => feature.id === selectedFeatureId) ??
    MODERN_FEATURE_DEFINITIONS.find((feature) => feature.id === selectedFeatureId) ??
    MODERN_FEATURE_DEFINITIONS[0];

  const selectedStyle = FEATURE_STYLES[selectedFeature.tone];
  const SelectedIcon = ICONS[selectedFeature.icon] ?? Sparkles;
  const selectedStage = selectedFeature.stages[stageIndex] ?? selectedFeature.stages[0];

  useEffect(() => {
    setStageIndex(0);
  }, [selectedFeature.id]);

  useEffect(() => {
    if (!isPlaying || selectedFeature.stages.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % selectedFeature.stages.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [isPlaying, selectedFeature.id, selectedFeature.stages.length]);

  const releaseCounts = useMemo(() => {
    const counts = MODERN_FEATURE_DEFINITIONS.reduce<Record<ModernFeatureRelease, number>>(
      (accumulator, feature) => {
        accumulator[feature.release] += 1;
        return accumulator;
      },
      {
        '2014': 0,
        '2019': 0,
        '2022': 0,
        '2025': 0,
      }
    );

    return counts;
  }, []);

  const renderLane = (mode: 'before' | 'after') => {
    const laneActive =
      mode === 'before'
        ? 'border-rose-500/25 bg-rose-500/10 text-rose-300'
        : cn(selectedStyle.border, selectedStyle.bg, selectedStyle.text);
    const dotClass =
      mode === 'before'
        ? 'bg-rose-300 shadow-[0_0_20px_rgba(251,113,133,0.75)]'
        : cn(selectedStyle.bg, selectedStyle.border, 'shadow-[0_0_20px_rgba(255,255,255,0.20)]');

    return (
      <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
              {mode === 'before' ? (language === 'es' ? 'Sin la feature' : 'Without the feature') : language === 'es' ? 'Con la feature' : 'With the feature'}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {mode === 'before'
                ? language === 'es'
                  ? 'Camino clasico del motor'
                  : 'Classic engine path'
                : language === 'es'
                  ? 'Ruta modernizada'
                  : 'Modernized path'}
            </p>
          </div>
          <div className={cn('rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]', laneActive)}>
            {mode === 'before' ? 'Baseline' : `SQL ${selectedFeature.release}`}
          </div>
        </div>

        <div className="relative mt-5 pt-8">
          <motion.div
            className={cn('absolute top-0 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border', dotClass)}
            animate={{ left: stageDotPosition(selectedFeature.stages.length, stageIndex) }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {selectedFeature.stages.map((stage, index) => {
              const isActive = index === stageIndex;
              return (
                <button
                  key={`${mode}-${stage.id}`}
                  onClick={() => {
                    setIsPlaying(false);
                    setStageIndex(index);
                  }}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all',
                    isActive ? laneActive : 'border-white/10 bg-black/20 text-white/65 hover:border-white/20 hover:bg-white/[0.06]'
                  )}
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.18em]">
                    {index + 1}. {pick(language, stage.label)}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-white/70">
                    {mode === 'before' ? pick(language, stage.before) : pick(language, stage.after)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-full flex-col gap-4 text-slate-200 sm:gap-6">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-yellow-300 via-orange-300 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent">
              <Sparkles className="h-8 w-8 text-yellow-300" />
              {t('tabModern')}
            </h2>
            <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">
              {language === 'es'
                ? 'Laboratorio visual de features del motor: selecciona una capacidad, reproduce su flujo y compara el camino clasico frente al comportamiento moderno.'
                : 'Visual feature lab: select a capability, play its flow and compare the classic engine path with the modern behavior.'}
            </p>
          </div>

          <div className="grid gap-2 text-left sm:text-right">
            {(['2014', '2019', '2022', '2025'] as const).map((release) => (
              <div
                key={release}
                className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/75"
              >
                SQL {release}: {releaseCounts[release]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="glass-panel h-fit rounded-3xl border border-white/10 p-4">
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/90">
                {language === 'es' ? 'Vista rapida' : 'Quick access'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {language === 'es'
                  ? 'Aqui ya aparecen 2014, 2019, 2022 y 2025. Cambia el filtro o haz click en cualquier feature para ver la simulacion.'
                  : 'This now includes 2014, 2019, 2022 and 2025. Change the filter or click any feature to open the simulation.'}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                {language === 'es' ? 'Filtrar por version' : 'Filter by release'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MODERN_FEATURE_RELEASES.map((release) => (
                  <button
                    key={release.id}
                    onClick={() => setReleaseFilter(release.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                      release.id === releaseFilter
                        ? 'border-white/20 bg-white/10 text-white'
                        : 'border-white/10 bg-black/25 text-white/55 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {pick(language, release.label)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {filteredFeatures.map((feature, index) => {
                const style = FEATURE_STYLES[feature.tone];
                const Icon = ICONS[feature.icon] ?? Sparkles;
                const isActive = feature.id === selectedFeature.id;

                return (
                  <motion.button
                    key={feature.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => {
                      setSelectedFeatureId(feature.id);
                      setIsPlaying(true);
                    }}
                    className={cn(
                      'rounded-3xl border p-4 text-left transition-all',
                      isActive ? cn(style.border, style.bg, style.glow) : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', style.border, style.bg)}>
                        <Icon className={cn('h-5 w-5', style.text)} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className={cn('text-sm font-black leading-tight', isActive ? style.text : 'text-white')}>
                              {pick(language, feature.title)}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-white/65">
                              {pick(language, feature.summary)}
                            </p>
                          </div>

                          <span className={cn('rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] whitespace-nowrap', style.chip)}>
                            {feature.release}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {feature.badges.slice(0, 2).map((badge) => (
                            <span
                              key={`${feature.id}-${badge}`}
                              className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/65"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFeature.id}
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
              transition={{ duration: 0.22 }}
              className="grid gap-6"
            >
              <div className={cn('glass-panel rounded-3xl border p-6 sm:p-8', selectedStyle.border)}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-4 flex items-center gap-3">
                          <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border', selectedStyle.border, selectedStyle.bg)}>
                            <SelectedIcon className={cn('h-7 w-7', selectedStyle.text)} />
                          </div>
                          <div>
                            <h3 className={cn('text-2xl font-bold', selectedStyle.text)}>{pick(language, selectedFeature.title)}</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={cn('rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]', selectedStyle.chip)}>
                                SQL Server {selectedFeature.release}
                              </span>
                              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/65">
                                {language === 'es' ? 'Lab visual' : 'Visual lab'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-base leading-relaxed text-white/82">{pick(language, selectedFeature.detail)}</p>

                        <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                            {language === 'es' ? 'Escenario' : 'Scenario'}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-white/80">{pick(language, selectedFeature.scenario)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      {selectedFeature.stages.map((stage, index) => (
                        <button
                          key={`${selectedFeature.id}-${stage.id}`}
                          onClick={() => {
                            setIsPlaying(false);
                            setStageIndex(index);
                          }}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-all',
                            index === stageIndex
                              ? cn(selectedStyle.border, selectedStyle.bg, selectedStyle.text)
                              : 'border-white/10 bg-white/5 text-white/45 hover:text-white'
                          )}
                        >
                          {index + 1}. {pick(language, stage.label)}
                        </button>
                      ))}

                      <button
                        onClick={() => setIsPlaying((current) => !current)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-all',
                          isPlaying
                            ? cn(selectedStyle.border, selectedStyle.bg, selectedStyle.text)
                            : 'border-white/10 bg-black/25 text-white/60 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {isPlaying ? (language === 'es' ? 'Auto on' : 'Auto on') : language === 'es' ? 'Auto off' : 'Auto off'}
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4">
                      {renderLane('before')}
                      {renderLane('after')}
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-200/90">
                          {language === 'es' ? 'Paso actual sin feature' : 'Current step without the feature'}
                        </p>
                        <h4 className="mt-3 text-lg font-bold text-white">{pick(language, selectedStage.label)}</h4>
                        <p className="mt-3 text-sm leading-relaxed text-rose-100/90">{pick(language, selectedStage.before)}</p>
                      </div>

                      <div className={cn('rounded-3xl border p-5', selectedStyle.border, selectedStyle.bg)}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                          {language === 'es' ? 'Paso actual con feature' : 'Current step with the feature'}
                        </p>
                        <h4 className="mt-3 text-lg font-bold text-white">{pick(language, selectedStage.label)}</h4>
                        <p className="mt-3 text-sm leading-relaxed text-white/85">{pick(language, selectedStage.after)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                        {language === 'es' ? 'Impacto visible' : 'Visible impact'}
                      </p>

                      <div className="mt-4 space-y-4">
                        {selectedFeature.metrics.map((metric) => (
                          <div key={`${selectedFeature.id}-${pick(language, metric.label)}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-bold text-white/80">{pick(language, metric.label)}</span>
                              <span className={selectedStyle.text}>
                                {metric.preference === 'lower'
                                  ? language === 'es'
                                    ? `${metricDelta(metric)} puntos menos`
                                    : `${metricDelta(metric)} points lower`
                                  : language === 'es'
                                    ? `${metricDelta(metric)} puntos mas`
                                    : `${metricDelta(metric)} points higher`}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div>
                                <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                                  <span>{language === 'es' ? 'Antes' : 'Before'}</span>
                                  <span>{metric.before}{metric.unit}</span>
                                </div>
                                <div className="h-2 rounded-full bg-black/30">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metric.before}%` }}
                                    className="h-2 rounded-full bg-rose-400/75"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                                  <span>{language === 'es' ? 'Despues' : 'After'}</span>
                                  <span>{metric.after}{metric.unit}</span>
                                </div>
                                <div className="h-2 rounded-full bg-black/30">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metric.after}%` }}
                                    className={cn('h-2 rounded-full', selectedStyle.bg)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                        {language === 'es' ? 'Que vigilar' : 'What to watch'}
                      </p>
                      <div className="mt-4 space-y-3">
                        {selectedFeature.watchpoints.map((item, index) => (
                          <div key={`${selectedFeature.id}-watch-${index}`} className="flex items-start gap-3">
                            <div className={cn('mt-2 h-2.5 w-2.5 rounded-full', selectedStyle.bg)} />
                            <p className="flex-1 text-sm leading-relaxed text-white/78">{pick(language, item)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {selectedFeature.badges.map((badge) => (
                          <span
                            key={`${selectedFeature.id}-badge-${badge}`}
                            className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/70"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                        {language === 'es' ? 'T-SQL rapido' : 'Quick T-SQL'}
                      </p>
                      <CopyCodeBlock code={selectedFeature.script} accent={selectedStyle.accent} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
