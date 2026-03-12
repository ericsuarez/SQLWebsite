import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, HeartPulse, Wrench } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { FirstResponderKitLab } from './jobs/FirstResponderKitLab';
import { JobsBestPracticesLab } from './jobs/JobsBestPracticesLab';
import { OlaHallengrenSimulator } from './jobs/OlaHallengrenSimulator';

type JobsTabId = 'ola' | 'brent' | 'practices';

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
  const [activeTab, setActiveTab] = useState<JobsTabId>('ola');

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel relative overflow-hidden border border-white/10 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_32%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[280px] flex-1">
            <h3 className="text-2xl font-bold text-white">
              {language === 'es' ? 'Jobs estandar de la industria (SQL Agent)' : 'Industry-standard SQL Agent jobs'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {language === 'es'
                ? 'Lab interactivo para entender por que Ola Hallengren reemplaza a los Maintenance Plans y por que sp_Blitz/sp_BlitzCache son la base de un health check serio.'
                : 'An interactive lab to learn why Ola Hallengren replaces Maintenance Plans and why sp_Blitz/sp_BlitzCache are the foundation of serious health checks.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/75">msdb</span>
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/75">SQL Agent</span>
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-bold text-white/75">Runbooks</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2',
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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'ola' ? (
            <OlaHallengrenSimulator />
          ) : activeTab === 'brent' ? (
            <FirstResponderKitLab />
          ) : (
            <JobsBestPracticesLab />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

