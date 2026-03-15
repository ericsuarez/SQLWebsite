import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowRight, HeartPulse, Play, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { FirstResponderKitLab } from './jobs/FirstResponderKitLab';
import { JobsBestPracticesLab } from './jobs/JobsBestPracticesLab';
import { OlaHallengrenSimulator } from './jobs/OlaHallengrenSimulator';

type JobsTabId = 'ola' | 'brent' | 'practices';
type JobsViewMode = 'intro' | 'play';

const TABS: Array<{
  id: JobsTabId;
  icon: any;
  title: { en: string; es: string };
  color: string;
}> = [
  { id: 'ola', icon: Wrench, title: { en: 'Ola Hallengren Maintenance', es: 'Mantenimiento de Ola Hallengren' }, color: 'text-amber-300' },
  { id: 'brent', icon: Activity, title: { en: 'Brent Ozar Health Checks', es: 'Health Checks de Brent Ozar' }, color: 'text-sky-300' },
  { id: 'practices', icon: HeartPulse, title: { en: 'Job Best Practices', es: 'Buenas practicas de Jobs' }, color: 'text-emerald-300' },
];

export function IndustryStandardJobs() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<JobsTabId>('ola');
  const [viewMode, setViewMode] = useState<JobsViewMode>('intro');

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'intro' || mode === 'play') {
      setViewMode(mode);
    }
  }, [searchParams]);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'ola' || view === 'brent' || view === 'practices') {
      setActiveTab(view);
    }
  }, [searchParams]);

  if (viewMode === 'intro') {
    return (
      <div className="flex min-h-full flex-col gap-4 sm:gap-6">
        <div className="glass-panel relative overflow-hidden border border-white/10 p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_32%)]" />
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white">
              {language === 'es' ? 'Ruta de Jobs de SQL Agent' : 'SQL Agent Jobs Path'}
            </h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/80">
              {language === 'es'
                ? 'Primero eliges el lab. Luego entras en una vista grande, sin tanto texto, para seguir la query, la evidencia y lo que haria un DBA senior en cada paso.'
                : 'First you choose the lab. Then you enter a large view, with less text, to follow the query, the evidence, and what a senior DBA would do at each step.'}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: language === 'es' ? 'Que vas a ver' : 'What you will see',
                  body: language === 'es'
                    ? 'La entrada real al motor, la decision o hallazgo y su impacto operativo.'
                    : 'The real engine input, the decision or finding, and its operational impact.',
                },
                {
                  title: language === 'es' ? 'Que hara el DBA' : 'What the DBA will do',
                  body: language === 'es'
                    ? 'Triage, validacion, evidencia y siguiente accion segura. No solo el “fix”.'
                    : 'Triage, validation, evidence, and the next safe action. Not only the “fix”.',
                },
                {
                  title: language === 'es' ? 'Como se usa' : 'How to use it',
                  body: language === 'es'
                    ? 'Briefing corto primero y despues play grande para trabajar sin scroll de pagina.'
                    : 'Short briefing first, then a large play mode so you can work without page scrolling.',
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

        <div className="grid gap-4 lg:grid-cols-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setViewMode('play');
                }}
                className="glass-panel rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.06] sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-5 w-5', tab.color)} />
                    <div className="text-sm font-black text-white">{language === 'es' ? tab.title.es : tab.title.en}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/45" />
                </div>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  {tab.id === 'ola'
                    ? language === 'es'
                      ? 'Simula la decision SKIP/REORGANIZE/REBUILD y observa el coste real de log.'
                      : 'Simulate SKIP/REORGANIZE/REBUILD decisions and observe real log cost.'
                    : tab.id === 'brent'
                      ? language === 'es'
                        ? 'Investiga hallazgos criticos y cache de planes con flujo de health-check.'
                        : 'Investigate critical findings and plan cache with a health-check flow.'
                      : language === 'es'
                        ? 'Ajusta configuracion de jobs y ve como sube o baja el riesgo operativo.'
                        : 'Tune job configuration and see operational risk rise or fall.'}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-start">
          <button
            onClick={() => setViewMode('play')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-200 transition-all hover:bg-emerald-500/25 sm:w-auto"
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
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex w-full items-center justify-start gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all sm:w-auto',
                  isActive
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? tab.color : 'text-muted-foreground')} />
                {language === 'es' ? tab.title.es : tab.title.en}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setViewMode('intro')}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white sm:w-auto"
        >
          {language === 'es' ? 'Descripcion' : 'Description'}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
            transition={{ duration: 0.25 }}
            className="min-h-full h-full"
          >
            {activeTab === 'ola' ? (
              <OlaHallengrenSimulator compact />
            ) : activeTab === 'brent' ? (
              <FirstResponderKitLab compact />
            ) : (
              <JobsBestPracticesLab compact />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
