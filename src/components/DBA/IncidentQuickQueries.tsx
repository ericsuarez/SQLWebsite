import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowRight, Cpu, Database, HardDrive, Lock, Play, Shield } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';
import { DBAActionBoard } from '../Shared/DBAActionBoard';
import {
  INCIDENT_QUERY_PACKS,
  type IncidentQuickPackId,
  type IncidentQueryScript,
  type LocalizedText,
  type QueryAccent,
} from '../../data/incidentQuickQueriesData';

type ScriptViewId = IncidentQueryScript['id'] | 'all';
type ViewMode = 'intro' | 'play';

const PACK_ACCENT: Record<IncidentQuickPackId, { border: string; bg: string; text: string; chip: string }> = {
  blocking: { border: 'border-rose-500/25', bg: 'bg-rose-500/10', text: 'text-rose-300', chip: 'border-rose-500/25 bg-rose-500/10 text-rose-200' },
  cpu: { border: 'border-amber-500/25', bg: 'bg-amber-500/10', text: 'text-amber-300', chip: 'border-amber-500/25 bg-amber-500/10 text-amber-200' },
  waits: { border: 'border-violet-500/25', bg: 'bg-violet-500/10', text: 'text-violet-300', chip: 'border-violet-500/25 bg-violet-500/10 text-violet-200' },
  memory: { border: 'border-cyan-500/25', bg: 'bg-cyan-500/10', text: 'text-cyan-300', chip: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200' },
  tempdb: { border: 'border-blue-500/25', bg: 'bg-blue-500/10', text: 'text-blue-300', chip: 'border-blue-500/25 bg-blue-500/10 text-blue-200' },
  'io-log': { border: 'border-emerald-500/25', bg: 'bg-emerald-500/10', text: 'text-emerald-300', chip: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' },
  'ha-dr': { border: 'border-sky-500/25', bg: 'bg-sky-500/10', text: 'text-sky-300', chip: 'border-sky-500/25 bg-sky-500/10 text-sky-200' },
};

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

function iconForPack(packId: IncidentQuickPackId) {
  switch (packId) {
    case 'blocking':
      return Lock;
    case 'cpu':
    case 'memory':
      return Cpu;
    case 'tempdb':
      return Database;
    case 'io-log':
      return HardDrive;
    case 'ha-dr':
      return Shield;
    default:
      return Activity;
  }
}

function accentForView(activeScriptId: ScriptViewId, script?: IncidentQueryScript): QueryAccent {
  if (activeScriptId === 'all') {
    return 'cyan';
  }

  return script?.accent ?? 'emerald';
}

function actionBoardForPack(language: 'en' | 'es', activePack: (typeof INCIDENT_QUERY_PACKS)[number], activeScriptId: ScriptViewId) {
  const title = { en: 'What the DBA does now', es: 'Qué hace ahora el DBA' };
  const packLabel = pick(language, activePack.title).toLowerCase();

  if (activeScriptId === 'detect') {
    return {
      title,
      focus: { en: `First prove the symptom for ${packLabel} before touching anything.`, es: `Primero demuestra el síntoma de ${packLabel} antes de tocar nada.` },
      actions: [
        { en: 'Run the fast query and isolate the hot SPID, wait family or file.', es: 'Ejecuta la query rápida y aísla el SPID, familia de waits o fichero caliente.' },
        { en: 'Keep the output small enough to read under pressure.', es: 'Mantén la salida lo bastante pequeña para leerla bajo presión.' },
        { en: 'Do not jump to remediation until the signal is real.', es: 'No saltes a la remediación hasta que la señal sea real.' },
      ],
      caution: activePack.caution,
      accent: 'amber' as const,
    };
  }

  if (activeScriptId === 'deep') {
    return {
      title,
      focus: { en: `Now pivot from symptom to root cause and confirm what is driving ${packLabel}.`, es: `Ahora pasa del síntoma a la causa raíz y confirma qué está empujando ${packLabel}.` },
      actions: [
        { en: 'Join the signal with live requests, waits, files or replica state.', es: 'Cruza la señal con requests, waits, ficheros o estado de réplicas.' },
        { en: 'Compare the current picture with history if the issue is intermittent.', es: 'Compara la foto actual con histórico si el problema es intermitente.' },
        { en: 'Decide whether you already have enough proof for a safe action.', es: 'Decide si ya tienes prueba suficiente para una acción segura.' },
      ],
      caution: activePack.caution,
      accent: 'violet' as const,
    };
  }

  if (activeScriptId === 'action') {
    return {
      title,
      focus: { en: 'Only now choose the safe action path and keep rollback risk visible.', es: 'Solo ahora elige la ruta de acción segura y mantén visible el riesgo de rollback.' },
      actions: [
        { en: 'Revalidate the symptom before touching production state.', es: 'Revalida el síntoma antes de tocar el estado de producción.' },
        { en: 'Execute only the targeted action, not a blind server-wide change.', es: 'Ejecuta solo la acción dirigida, no un cambio ciego a nivel de servidor.' },
        { en: 'Monitor the aftermath and attach the evidence to the incident.', es: 'Monitoriza el después y adjunta la evidencia a la incidencia.' },
      ],
      caution: activePack.caution,
      accent: 'rose' as const,
    };
  }

  return {
    title,
    focus: { en: 'Use the full pack only when you need the whole route in one console.', es: 'Usa el pack completo solo cuando necesites toda la ruta en una consola.' },
    actions: [
      { en: 'Read the fast query first, then the deep query, then the action block.', es: 'Lee primero la query rápida, luego la profunda y al final el bloque de acción.' },
      { en: 'Keep the route ordered so the incident stays reproducible.', es: 'Mantén la ruta ordenada para que la incidencia siga siendo reproducible.' },
      { en: 'Mark which output actually justified the action you took.', es: 'Marca qué salida justificó de verdad la acción tomada.' },
    ],
    caution: activePack.caution,
    accent: 'cyan' as const,
  };
}

export function IncidentQuickQueries() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [activePackId, setActivePackId] = useState<IncidentQuickPackId>('blocking');
  const [activeScriptId, setActiveScriptId] = useState<ScriptViewId>('detect');

  const activePack = INCIDENT_QUERY_PACKS.find((pack) => pack.id === activePackId) ?? INCIDENT_QUERY_PACKS[0];
  const accent = PACK_ACCENT[activePack.id];

  useEffect(() => {
    setActiveScriptId('detect');
  }, [activePackId]);

  const activeScript = activePack.scripts.find((script) => script.id === activeScriptId);
  const allCode = useMemo(
    () => activePack.scripts.map((script) => `-- ${pick(language, script.title)}\n${script.code}`).join('\n\n'),
    [activePack, language]
  );
  const board = actionBoardForPack(language, activePack, activeScriptId);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'intro' || mode === 'play') {
      setViewMode(mode);
    }
  }, [searchParams]);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'detect' || view === 'deep' || view === 'action' || view === 'all') {
      setActiveScriptId(view);
    }
  }, [searchParams]);

  if (viewMode === 'intro') {
    return (
      <div className="flex min-h-full flex-col gap-5">
        <div className="glass-panel relative overflow-hidden border border-white/10 p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_34%)]" />
          <div className="relative z-10">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
              {language === 'es' ? 'Briefing de incidencias' : 'Incident briefing'}
            </div>
            <h2 className="mt-2 text-3xl font-black text-white">
              {language === 'es' ? 'Queries rápidas para triage' : 'Quick queries for triage'}
            </h2>
            <p className="mt-3 max-w-5xl text-sm leading-7 text-white/80">
              {language === 'es'
                ? 'Primero eliges el síntoma y ves qué ruta vas a seguir. Después entras en play para quedarte solo con el pack, la query activa y la acción operativa.'
                : 'Choose the symptom first and see which route you will follow. Then enter play to keep only the pack, the active query, and the operational action.'}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: language === 'es' ? 'Qué verás' : 'What you will see',
                  body: language === 'es' ? 'Síntoma, guion rápido, queries y validación antes de tocar producción.' : 'Symptom, quick route, queries, and validation before touching production.',
                },
                {
                  title: language === 'es' ? 'Qué hará el DBA' : 'What the DBA will do',
                  body: language === 'es' ? 'Detectar, profundizar y solo después ejecutar una acción segura.' : 'Detect, deepen, and only then execute a safe action.',
                },
                {
                  title: language === 'es' ? 'Cómo se usa' : 'How to use it',
                  body: language === 'es' ? 'Briefing corto primero y luego consola grande sin scroll de página.' : 'Short briefing first, then a large console with no page scroll.',
                },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">{card.title}</div>
                  <p className="mt-2 text-sm leading-7 text-white/75">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {INCIDENT_QUERY_PACKS.map((pack) => {
            const Icon = iconForPack(pack.id);
            const isActive = pack.id === activePack.id;
            const packAccent = PACK_ACCENT[pack.id];

            return (
              <button
                key={pack.id}
                onClick={() => {
                  setActivePackId(pack.id);
                  setViewMode('play');
                }}
                className={cn('rounded-3xl border p-4 text-left transition-all', isActive ? `${packAccent.border} ${packAccent.bg}` : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', isActive ? packAccent.text : 'text-white/45')} />
                    <div className={cn('text-sm font-black', isActive ? 'text-white' : 'text-white/80')}>{pick(language, pack.title)}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/45" />
                </div>
                <p className="mt-3 text-sm leading-7 text-white/65">{pick(language, pack.symptom)}</p>
                <p className="mt-3 text-sm leading-7 text-white/55">{pick(language, pack.summary)}</p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-start">
          <button
            onClick={() => setViewMode('play')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-200 transition-all hover:bg-cyan-500/25 sm:w-auto"
          >
            <Play className="h-4 w-4" />
            {language === 'es' ? 'Entrar en Play' : 'Enter Play'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4 lg:h-[calc(100dvh-10.5rem)]">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          {INCIDENT_QUERY_PACKS.map((pack) => {
            const Icon = iconForPack(pack.id);
            const isActive = pack.id === activePack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setActivePackId(pack.id)}
                className={cn('flex w-full items-center justify-start gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all sm:w-auto', isActive ? `${accent.bg} ${accent.border} text-white` : 'bg-white/5 text-muted-foreground hover:bg-white/10')}
              >
                <Icon className={cn('h-4 w-4', isActive ? accent.text : 'text-muted-foreground')} />
                {pick(language, pack.title)}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setViewMode('intro')}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
        >
          {language === 'es' ? 'Descripción' : 'Description'}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="glass-panel min-h-0 overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-5">
          <div className={cn('rounded-3xl border p-5', accent.border, accent.bg)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={cn('text-sm font-black', accent.text)}>{pick(language, activePack.title)}</div>
                <p className="mt-2 text-sm leading-7 text-white/80">{pick(language, activePack.symptom)}</p>
                <p className="mt-2 text-sm leading-7 text-white/65">{pick(language, activePack.summary)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activePack.badges.map((badge) => (
                  <span key={badge} className={cn('rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]', accent.chip)}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-4">
            {activePack.quickSteps.map((step, index) => (
              <div key={`${activePack.id}-step-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                  {language === 'es' ? `Paso ${index + 1}` : `Step ${index + 1}`}
                </div>
                <p className="mt-2 text-sm leading-7 text-white/75">{pick(language, step)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
            <div className="flex min-h-0 flex-col gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                  {language === 'es' ? 'Cuándo usar este pack' : 'When to use this pack'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activePack.whenToUse)}</p>
              </div>

              <div className="min-h-0 rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                      {language === 'es' ? 'Query activa' : 'Active query'}
                    </div>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      {activeScriptId === 'all' ? (language === 'es' ? 'Pack completo' : 'Full pack') : pick(language, activeScript?.title ?? activePack.scripts[0].title)}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-white/70">
                      {activeScriptId === 'all'
                        ? language === 'es'
                          ? 'Toda la ruta en un único bloque para abrir la incidencia sin perder pasos.'
                          : 'The whole route in one block so you can start the incident without losing steps.'
                        : pick(language, activeScript?.description ?? activePack.scripts[0].description)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activePack.scripts.map((script) => (
                      <button
                        key={script.id}
                        onClick={() => setActiveScriptId(script.id)}
                        className={cn('rounded-full border px-4 py-1.5 text-xs font-bold transition-all', activeScriptId === script.id ? accent.chip : 'border-white/10 bg-black/20 text-white/55 hover:text-white')}
                      >
                        {pick(language, script.title)}
                      </button>
                    ))}
                    <button
                      onClick={() => setActiveScriptId('all')}
                      className={cn('rounded-full border px-4 py-1.5 text-xs font-bold transition-all', activeScriptId === 'all' ? accent.chip : 'border-white/10 bg-black/20 text-white/55 hover:text-white')}
                    >
                      {language === 'es' ? 'Pack completo' : 'Full pack'}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activePack.id}-${activeScriptId}`}
                    initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                    transition={{ duration: 0.2 }}
                    className="mt-5"
                  >
                    <CopyCodeBlock
                      code={activeScriptId === 'all' ? allCode : activeScript?.code ?? activePack.scripts[0].code}
                      accent={accentForView(activeScriptId, activeScript)}
                      contentClassName="max-h-[360px]"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                  {language === 'es' ? 'Qué mirar en pantalla' : 'What to watch on screen'}
                </div>
                <div className="mt-3 space-y-3">
                  {activePack.watchItems.map((item, index) => (
                    <div key={`${activePack.id}-watch-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-7 text-white/75">
                      {pick(language, item)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200/80">
                  {language === 'es' ? 'Antes de tocar producción' : 'Before touching production'}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/80">{pick(language, activePack.caution)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel min-h-0 overflow-hidden rounded-3xl border border-white/10 p-4 sm:p-5">
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <DBAActionBoard language={language} accent={board.accent} title={board.title} focus={board.focus} actions={board.actions} caution={board.caution} />

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                {language === 'es' ? 'Checklist de salida' : 'Exit checklist'}
              </div>
              <div className="mt-3 space-y-3">
                {[
                  language === 'es' ? 'Síntoma probado con señal real' : 'Symptom proved with a real signal',
                  language === 'es' ? 'Root cause acotada o descartada' : 'Root cause narrowed down or discarded',
                  language === 'es' ? 'Acción ejecutada o pospuesta con criterio' : 'Action executed or postponed with clear criteria',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-7 text-white/75">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
