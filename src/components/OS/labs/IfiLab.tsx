import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ShieldCheck } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useLanguage } from '../../../contexts/LanguageContext';

type DbStatus = 'idle' | 'creating' | 'done';

export function IfiLab() {
  const { t, language } = useLanguage();
  const [ifiEnabled, setIfiEnabled] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatus>('idle');
  const [progress, setProgress] = useState(0);

  const createDataFile = () => {
    setDbStatus('creating');
    setProgress(0);
  };

  useEffect(() => {
    if (dbStatus !== 'creating') return;

    // With IFI, the allocation is "almost instant" (no zeroing); without IFI we simulate slow zeroing.
    const step = ifiEnabled ? 60 : 6;
    const intervalMs = 120;

    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + step);
        if (next >= 100) {
          window.clearInterval(id);
          setDbStatus('done');
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [dbStatus, ifiEnabled]);

  const statusLabel =
    dbStatus === 'idle'
      ? null
      : dbStatus === 'creating'
        ? ifiEnabled
          ? language === 'es'
            ? 'Invocando SetFileValidData()...'
            : 'Calling SetFileValidData()...'
          : t('zeroingDisk')
        : t('allocationComplete');

  return (
    <div className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">
            {language === 'es' ? 'Lab interactivo' : 'Interactive lab'}
          </p>
          <h4 className="mt-2 flex items-center gap-2 text-lg font-black text-white">
            <ShieldCheck className="h-5 w-5 text-orange-300" />
            {t('ifiTitle')}
          </h4>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-white/70">{t('ifiDesc')}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIfiEnabled((x) => !x)}
            className="group inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-left transition-colors hover:bg-white/10"
          >
            <span
              className={cn(
                'relative inline-flex h-6 w-12 items-center rounded-full border p-1 transition-colors',
                ifiEnabled ? 'border-emerald-500/40 bg-emerald-500/30' : 'border-white/10 bg-black/40'
              )}
              aria-hidden
            >
              <motion.span
                className="h-4 w-4 rounded-full bg-white shadow-sm"
                animate={{ x: ifiEnabled ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </span>
            <span className="text-sm font-bold text-white">{t('enableIfi')}</span>
          </button>

          <button
            type="button"
            onClick={createDataFile}
            disabled={dbStatus === 'creating'}
            className="rounded-2xl border border-orange-500/30 bg-orange-500/20 px-5 py-2 text-sm font-black text-orange-200 transition-colors hover:bg-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('allocateBtn')}
          </button>
        </div>

        {dbStatus !== 'idle' && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-black">
              <span className={cn(dbStatus === 'done' ? 'text-emerald-300' : 'text-orange-300', dbStatus === 'creating' && 'animate-pulse')}>
                {statusLabel}
              </span>
              <span className="text-white/50">10,000 MB</span>
            </div>

            <div className="mt-3 h-4 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <motion.div
                className={cn('h-full', ifiEnabled ? 'bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.45)]' : 'bg-orange-500')}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.12, ease: 'linear' }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {!ifiEnabled && dbStatus === 'creating' && <p className="text-xs text-rose-200/90">{t('noticeDelay')}</p>}
              <div className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white/60">
                <Cpu className="h-3.5 w-3.5 text-cyan-300" />
                <span>{t('apiCallLabel')}</span>
                <span className={cn('font-bold', ifiEnabled ? 'text-emerald-300' : 'text-orange-200')}>
                  {ifiEnabled ? 'SetFileValidData(hFile, 10GB)' : 'WriteFile(hFile, 0x00...)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

