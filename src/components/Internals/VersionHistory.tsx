import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Clock3, History, Layers, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  SQL_SERVER_RELEASES,
  VERSION_DISCOVERY_TSQL,
  VERSION_UPDATE_TRACKS,
  type LocalizedText,
} from '../../data/advancedSQLData';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

export function VersionHistory() {
  const { language, t } = useLanguage();
  const [activeReleaseId, setActiveReleaseId] = useState('2022');
  const [activeTrackId, setActiveTrackId] = useState<(typeof VERSION_UPDATE_TRACKS)[number]['id']>('current');

  const activeRelease = SQL_SERVER_RELEASES.find((release) => release.id === activeReleaseId) ?? SQL_SERVER_RELEASES[SQL_SERVER_RELEASES.length - 2];
  const activeTrack = VERSION_UPDATE_TRACKS.find((track) => track.id === activeTrackId) ?? VERSION_UPDATE_TRACKS[2];

  const sortedReleases = useMemo(
    () => [...SQL_SERVER_RELEASES].sort((left, right) => right.year - left.year),
    []
  );

  return (
    <div className="flex h-full flex-col gap-6 text-slate-200">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.16),transparent_30%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-5xl">
            <h2 className="mb-2 flex items-center gap-3 bg-gradient-to-r from-lime-300 via-yellow-300 to-emerald-300 bg-clip-text text-3xl font-bold text-transparent">
              <History className="h-8 w-8 text-lime-400" />
              {t('tabVersionHistory')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {language === 'es'
                ? 'Aqui se ve la historia de SQL Server por grandes versiones: que aporto cada una, por que cambiaron las decisiones de arquitectura y como leer hoy la version, la edicion y el modelo de actualizaciones.'
                : 'This view maps SQL Server history by major releases: what each branch introduced, why architecture decisions changed and how to read version, edition and servicing today.'}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <div className="rounded-full border border-lime-500/20 bg-lime-500/10 px-3 py-1 text-xs font-bold text-lime-300">
              RTM / SP / CU
            </div>
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              Query Store era
            </div>
            <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
              2000 -&gt; 2025
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
            <CalendarClock className="h-4 w-4" />
            {language === 'es' ? 'Linea temporal' : 'Timeline'}
          </div>
          <div className="mt-5 space-y-3">
            {sortedReleases.map((release) => {
              const isActive = release.id === activeRelease.id;

              return (
                <motion.button
                  key={release.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setActiveReleaseId(release.id)}
                  className={cn(
                    'w-full rounded-3xl border p-3 text-left transition-all',
                    isActive
                      ? 'border-lime-500/25 bg-lime-500/10 shadow-[0_0_22px_rgba(163,230,53,0.10)]'
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{release.version}</div>
                      <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-lime-300">{release.year}</div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
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

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                <Layers className="h-4 w-4" />
                {language === 'es' ? 'Contexto historico' : 'Historical context'}
              </div>
              <p className="mt-4 text-sm leading-7 text-white/80">{pick(language, activeRelease.history)}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {activeRelease.highlights.map((item, index) => (
                  <motion.div
                    key={`${activeRelease.id}-${index}`}
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

            <div className="rounded-3xl border border-lime-500/20 bg-lime-500/10 p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">
                <Clock3 className="h-4 w-4" />
                {language === 'es' ? 'Mantenimiento' : 'Servicing'}
              </div>
              <p className="mt-4 text-sm leading-7 text-white/85">{pick(language, activeRelease.servicing)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              {language === 'es' ? 'Modelo de actualizaciones' : 'Update model'}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {language === 'es'
                ? 'No todas las ramas se mantienen igual: RTM, Service Pack, CU y GDR cambian la estrategia operativa'
                : 'Not every branch is serviced the same way: RTM, Service Pack, CU and GDR change the operational strategy'}
            </h3>
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            {VERSION_UPDATE_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setActiveTrackId(track.id)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all',
                  activeTrackId === track.id
                    ? 'bg-lime-500/20 text-lime-300'
                    : 'text-white/55 hover:bg-white/5 hover:text-white'
                )}
              >
                {pick(language, track.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
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

          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <h4 className="text-lg font-bold text-white">
              {language === 'es' ? 'T-SQL para identificar version y update' : 'T-SQL to identify version and update'}
            </h4>
            <p className="mt-2 text-sm text-white/60">
              {language === 'es'
                ? 'Esto te da rama, nivel, edicion y referencia de update para compararlo con la documentacion oficial.'
                : 'This gives you branch, level, edition and update reference so you can compare against the official build documentation.'}
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
