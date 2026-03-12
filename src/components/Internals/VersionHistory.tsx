import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, CalendarClock, Clock3, Database, History, Layers, Server, Settings, Shield, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  SQL_SERVER_RELEASES,
  VERSION_DISCOVERY_TSQL,
  VERSION_UPDATE_TRACKS,
  type LocalizedText,
} from '../../data/advancedSQLData';
import { RELEASE_AREA_META, SQL_SERVER_RELEASE_AREAS, type ReleaseAreaId } from '../../data/versionHistoryData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

const ICONS: Record<string, any> = {
  Database,
  Activity,
  Layers,
  Shield,
  Server,
  Settings,
};

const AREA_STYLES: Record<
  ReleaseAreaId,
  {
    border: string;
    bg: string;
    text: string;
    chip: string;
    glow: string;
  }
> = {
  engine: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    chip: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    glow: 'shadow-[0_0_28px_rgba(16,185,129,0.10)]',
  },
  query: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    chip: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
    glow: 'shadow-[0_0_28px_rgba(34,211,238,0.10)]',
  },
  ha: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
    chip: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    glow: 'shadow-[0_0_28px_rgba(56,189,248,0.10)]',
  },
  security: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    chip: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
    glow: 'shadow-[0_0_28px_rgba(251,113,133,0.10)]',
  },
  platform: {
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    text: 'text-violet-300',
    chip: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
    glow: 'shadow-[0_0_28px_rgba(167,139,250,0.10)]',
  },
  ops: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    chip: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    glow: 'shadow-[0_0_28px_rgba(251,191,36,0.10)]',
  },
};

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

export function VersionHistory() {
  const { language, t } = useLanguage();
  const [activeReleaseId, setActiveReleaseId] = useState('2022');
  const [activeAreaId, setActiveAreaId] = useState<ReleaseAreaId>('engine');
  const [activeTrackId, setActiveTrackId] = useState<(typeof VERSION_UPDATE_TRACKS)[number]['id']>('current');

  const sortedReleases = useMemo(
    () => [...SQL_SERVER_RELEASES].sort((left, right) => right.year - left.year),
    []
  );

  const activeRelease = SQL_SERVER_RELEASES.find((release) => release.id === activeReleaseId) ?? sortedReleases[0];
  const activeTrack = VERSION_UPDATE_TRACKS.find((track) => track.id === activeTrackId) ?? VERSION_UPDATE_TRACKS[0];

  const releaseAreas = SQL_SERVER_RELEASE_AREAS[activeRelease.id] ?? [];
  const activeArea = releaseAreas.find((area) => area.id === activeAreaId) ?? releaseAreas[0];

  useEffect(() => {
    const nextAreas = SQL_SERVER_RELEASE_AREAS[activeReleaseId] ?? [];
    if (nextAreas.length === 0) {
      return;
    }
    if (nextAreas.some((area) => area.id === activeAreaId)) {
      return;
    }
    setActiveAreaId(nextAreas[0].id);
  }, [activeAreaId, activeReleaseId]);

  return (
    <div className="flex h-full flex-col gap-6 text-slate-200">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.16),transparent_30%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[280px] flex-1">
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-lime-300 via-yellow-300 to-emerald-300 bg-clip-text text-3xl font-bold text-transparent">
              <History className="h-8 w-8 text-lime-400" />
              {t('tabVersionHistory')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {language === 'es'
                ? 'Linea temporal por releases: selecciona una version y explora que cambio en motor, query processing, HA, seguridad, plataforma y operacion. Pensado para entender upgrades y decisiones de arquitectura.'
                : 'A release timeline: pick a version and explore what changed in engine, query processing, HA, security, platform and operations. Designed for upgrade planning and architectural decisions.'}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <div className="rounded-full border border-lime-500/20 bg-lime-500/10 px-3 py-1 text-xs font-bold text-lime-300">
              RTM / SP / CU / GDR
            </div>
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              Query Store + IQP
            </div>
            <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
              2000 -&gt; 2025
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_420px]">
        <div className="glass-panel rounded-3xl border border-white/10 p-5 xl:sticky xl:top-5 self-start">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
            <CalendarClock className="h-4 w-4" />
            {language === 'es' ? 'Versiones' : 'Releases'}
          </div>
          <div className="mt-5 space-y-2">
            {sortedReleases.map((release) => {
              const isActive = release.id === activeRelease.id;

              return (
                <motion.button
                  key={release.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setActiveReleaseId(release.id)}
                  className={cn(
                    'w-full rounded-3xl border px-4 py-3 text-left transition-all',
                    isActive
                      ? 'border-lime-500/25 bg-lime-500/10 shadow-[0_0_22px_rgba(163,230,53,0.10)]'
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                  )}
                  title={release.version}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full border',
                        isActive
                          ? 'border-lime-400/40 bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.35)]'
                          : 'border-white/15 bg-white/10'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-sm font-black tracking-wide', isActive ? 'text-white' : 'text-white/75')}>{release.year}</div>
                      <div className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                        {pick(language, release.era)}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRelease.id}
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-[280px] flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                    {language === 'es' ? 'Version activa' : 'Active release'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-3xl font-bold text-white">{activeRelease.version}</h3>
                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/70">
                      {pick(language, activeRelease.era)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activeRelease.summary)}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 px-5 py-4 text-right">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                    {language === 'es' ? 'Lanzamiento' : 'Release'}
                  </div>
                  <div className="mt-1 text-3xl font-black text-lime-300">{activeRelease.year}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                    <Layers className="h-4 w-4" />
                    {language === 'es' ? 'Contexto historico' : 'Historical context'}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeRelease.history)}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                    <Sparkles className="h-4 w-4" />
                    {language === 'es' ? 'Momentos clave' : 'Highlights'}
                  </div>
                  <div className="mt-4 grid gap-3">
                    {activeRelease.highlights.map((item, index) => (
                      <motion.div
                        key={`${activeRelease.id}-highlight-${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex gap-3"
                      >
                        <div className="mt-0.5 h-8 w-8 shrink-0 rounded-2xl border border-white/10 bg-black/25 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-emerald-300" />
                        </div>
                        <p className="text-sm leading-7 text-white/80">{pick(language, item)}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                      {language === 'es' ? 'Detalle por areas' : 'Area deep dive'}
                    </p>
                    <h4 className="mt-2 text-xl font-bold text-white">
                      {language === 'es'
                        ? 'Haz click en una tarjeta para ver que introdujo esa version en cada capa'
                        : 'Click a card to see what that release introduced in each layer'}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeRelease.badges.map((badge) => (
                      <span
                        key={`${activeRelease.id}-${badge}`}
                        className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/75"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {releaseAreas.length > 0 ? (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {releaseAreas.map((area) => {
                        const meta = RELEASE_AREA_META[area.id];
                        const style = AREA_STYLES[area.id];
                        const Icon = ICONS[meta.icon] ?? Sparkles;
                        const isActiveArea = area.id === activeArea?.id;

                        return (
                          <motion.button
                            key={`${activeRelease.id}-${area.id}`}
                            whileHover={{ y: -2 }}
                            onClick={() => setActiveAreaId(area.id)}
                            className={cn(
                              'rounded-3xl border p-4 text-left transition-all',
                              isActiveArea ? cn(style.border, style.bg, style.glow) : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className={cn('h-10 w-10 rounded-2xl border border-white/10 bg-black/25 flex items-center justify-center', style.bg)}>
                                <Icon className={cn('h-5 w-5', style.text)} />
                              </div>
                              <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', style.chip)}>
                                {area.badges[0] ?? 'SQL'}
                              </span>
                            </div>
                            <div className="mt-4 text-sm font-bold text-white">{pick(language, meta.title)}</div>
                            <p className="mt-2 text-xs leading-6 text-white/65">{pick(language, area.summary)}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {area.badges.slice(0, 3).map((badge) => (
                                <span
                                  key={`${activeRelease.id}-${area.id}-${badge}`}
                                  className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/65"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {activeArea && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${activeRelease.id}-${activeArea.id}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={cn('mt-4 rounded-3xl border bg-black/25 p-5', AREA_STYLES[activeArea.id].border)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-[240px] flex-1">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const meta = RELEASE_AREA_META[activeArea.id];
                                  const style = AREA_STYLES[activeArea.id];
                                  const Icon = ICONS[meta.icon] ?? Sparkles;
                                  return (
                                    <>
                                      <div className={cn('h-10 w-10 rounded-2xl border border-white/10 bg-black/25 flex items-center justify-center', style.bg)}>
                                        <Icon className={cn('h-5 w-5', style.text)} />
                                      </div>
                                      <div>
                                        <div className="text-lg font-bold text-white">{pick(language, meta.title)}</div>
                                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                                          {language === 'es' ? 'Detalle tecnico' : 'Technical detail'}
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                              <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeArea.details)}</p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
                                {language === 'es' ? 'Conceptos' : 'Concepts'}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {activeArea.badges.map((badge) => (
                                  <span
                                    key={`${activeRelease.id}-${activeArea.id}-badge-${badge}`}
                                    className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/75"
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {activeArea.points.map((point, index) => (
                              <motion.div
                                key={`${activeRelease.id}-${activeArea.id}-point-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.04 * index }}
                                className="rounded-3xl border border-white/10 bg-black/30 p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={cn('mt-0.5 h-8 w-8 shrink-0 rounded-2xl border border-white/10 bg-black/25 flex items-center justify-center', AREA_STYLES[activeArea.id].bg)}>
                                    <Sparkles className={cn('h-4 w-4', AREA_STYLES[activeArea.id].text)} />
                                  </div>
                                  <p className="text-sm leading-7 text-white/80">{pick(language, point)}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </>
                ) : (
                  <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/70">
                    {language === 'es'
                      ? 'No hay detalles adicionales para esta version.'
                      : 'No deep-dive details available for this release yet.'}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-6 xl:sticky xl:top-5 self-start">
          <div className="glass-panel rounded-3xl border border-white/10 p-6">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              <Clock3 className="h-4 w-4" />
              {language === 'es' ? 'Mantenimiento' : 'Servicing'}
            </div>
            <p className="mt-4 text-sm leading-7 text-white/85">{pick(language, activeRelease.servicing)}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {activeRelease.badges.map((badge) => (
                <span
                  key={`${activeRelease.id}-servicing-${badge}`}
                  className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-white/75"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-white/10 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-[220px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                  {language === 'es' ? 'Modelo de actualizaciones' : 'Update model'}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {language === 'es'
                    ? 'RTM, SP, CU y GDR cambian tu estrategia operativa'
                    : 'RTM, SP, CU and GDR change your operational strategy'}
                </h3>
              </div>
              <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
                {VERSION_UPDATE_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setActiveTrackId(track.id)}
                    className={cn(
                      'rounded-xl px-3 py-2 text-xs font-bold transition-all',
                      activeTrackId === track.id ? 'bg-lime-500/20 text-lime-300' : 'text-white/55 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {pick(language, track.label)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
              <h4 className="text-lg font-bold text-white">{pick(language, activeTrack.label)}</h4>
              <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activeTrack.summary)}</p>
              <p className="mt-4 text-sm leading-7 text-white/65">{pick(language, activeTrack.detail)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {activeTrack.badges.map((badge) => (
                  <span
                    key={`${activeTrack.id}-${badge}`}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-white/75"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-white/10 p-6">
            <h4 className="text-lg font-bold text-white">
              {language === 'es' ? 'T-SQL para identificar version y update' : 'T-SQL to identify version and update'}
            </h4>
            <p className="mt-2 text-sm text-white/60">
              {language === 'es'
                ? 'Te da rama, nivel, edicion y referencia de update para compararlo con la lista oficial de builds.'
                : 'Returns branch, level, edition and update reference so you can compare against the official build list.'}
            </p>
            <div className="mt-5 space-y-4">
              <CopyCodeBlock code={VERSION_DISCOVERY_TSQL.current} accent="emerald" />
              <CopyCodeBlock code={VERSION_DISCOVERY_TSQL.buildDiscipline} accent="amber" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
