import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, ShieldAlert } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useLanguage } from '../../../contexts/LanguageContext';

export function LpimLab() {
  const { t, language } = useLanguage();
  const [lpimEnabled, setLpimEnabled] = useState(false);

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            {language === 'es' ? 'Lab interactivo' : 'Interactive lab'}
          </p>
          <h4 className="mt-2 flex items-center gap-2 text-lg font-black text-white">
            <ShieldAlert className="h-5 w-5 text-emerald-300" />
            {t('lpimTitle')}
          </h4>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-white/70">{t('lpimDesc')}</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold text-white/60">
          <span className={cn('h-1.5 w-1.5 rounded-full', lpimEnabled ? 'bg-emerald-400' : 'bg-amber-400')} />
          {lpimEnabled ? 'RESOURCE_MEMPHYSICAL_LOW: OFF' : 'RESOURCE_MEMPHYSICAL_LOW: ON'}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setLpimEnabled((x) => !x)}
            className="group inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-left transition-colors hover:bg-white/10"
          >
            <span
              className={cn(
                'relative inline-flex h-6 w-12 items-center rounded-full border p-1 transition-colors',
                lpimEnabled ? 'border-emerald-500/40 bg-emerald-500/30' : 'border-white/10 bg-black/40'
              )}
              aria-hidden
            >
              <motion.span
                className="h-4 w-4 rounded-full bg-white shadow-sm"
                animate={{ x: lpimEnabled ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </span>
            <span className="text-sm font-bold text-white">{lpimEnabled ? t('lpimEnabled') : t('lpimDisabled')}</span>
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-bold text-white/60">
            {lpimEnabled ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-emerald-300" />
                {language === 'es' ? 'Buffer Pool protegido' : 'Buffer Pool pinned'}
              </>
            ) : (
              <>
                <HardDrive className="h-3.5 w-3.5 text-amber-300" />
                {language === 'es' ? 'Paginacion activa' : 'Paging active'}
              </>
            )}
          </div>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <div className="grid grid-cols-2">
            <div className="relative z-10 flex h-32 flex-col items-center justify-center gap-2 border-r border-white/10 p-4">
              <div className="text-sm font-black text-white">{language === 'es' ? 'RAM' : 'RAM'}</div>
              <Cpu className="h-8 w-8 text-white/60" />
              <div className="text-[11px] font-bold text-white/40">{language === 'es' ? 'Buffer Pool' : 'Buffer Pool'}</div>
            </div>
            <div className="relative z-10 flex h-32 flex-col items-center justify-center gap-2 p-4">
              <div className="text-sm font-black text-white">{language === 'es' ? 'Pagefile.sys (Disco)' : 'Pagefile.sys (Disk)'}</div>
              <HardDrive className="h-8 w-8 text-rose-300/70" />
              <div className="text-[11px] font-bold text-white/40">{language === 'es' ? 'I/O aleatorio' : 'Random I/O'}</div>
            </div>
          </div>

          {!lpimEnabled && (
            <motion.div
              aria-hidden
              animate={{ x: [0, 170, 0] }}
              transition={{ repeat: Infinity, duration: 2.1, ease: 'easeInOut' }}
              className="absolute left-[14%] top-1/2 h-8 w-10 -translate-y-1/2 rounded-xl bg-amber-500/35 blur-[1px]"
            />
          )}

          {lpimEnabled && (
            <div className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-emerald-500/30 bg-emerald-500/10">
              <ShieldAlert className="h-8 w-8 text-emerald-300" />
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-white/65">
          {lpimEnabled
            ? language === 'es'
              ? 'El SO no puede enviar a disco las paginas del Buffer Pool. Menos latencia espuria bajo presion.'
              : 'The OS cannot page Buffer Pool pages out. Less noisy latency under pressure.'
            : language === 'es'
              ? 'Bajo presion de memoria, el SO puede paginar el Buffer Pool hacia Pagefile.sys y aumentar la latencia.'
              : 'Under memory pressure, the OS may page Buffer Pool pages to Pagefile.sys and increase latency.'}
        </div>
      </div>
    </div>
  );
}

