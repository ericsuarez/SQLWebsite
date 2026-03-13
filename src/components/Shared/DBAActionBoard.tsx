import { ActivitySquare, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LocalizedText {
  en: string;
  es: string;
}

interface DBAActionBoardProps {
  language: 'en' | 'es';
  accent?: 'emerald' | 'amber' | 'cyan' | 'rose' | 'violet' | 'sky';
  title: LocalizedText;
  focus: LocalizedText;
  actions: LocalizedText[];
  caution?: LocalizedText;
}

const ACCENT_STYLE: Record<NonNullable<DBAActionBoardProps['accent']>, { wrap: string; text: string; chip: string }> = {
  emerald: {
    wrap: 'border-emerald-500/20 bg-emerald-500/10',
    text: 'text-emerald-200',
    chip: 'border-emerald-500/20 bg-black/20 text-emerald-200',
  },
  amber: {
    wrap: 'border-amber-500/20 bg-amber-500/10',
    text: 'text-amber-200',
    chip: 'border-amber-500/20 bg-black/20 text-amber-200',
  },
  cyan: {
    wrap: 'border-cyan-500/20 bg-cyan-500/10',
    text: 'text-cyan-200',
    chip: 'border-cyan-500/20 bg-black/20 text-cyan-200',
  },
  rose: {
    wrap: 'border-rose-500/20 bg-rose-500/10',
    text: 'text-rose-200',
    chip: 'border-rose-500/20 bg-black/20 text-rose-200',
  },
  violet: {
    wrap: 'border-violet-500/20 bg-violet-500/10',
    text: 'text-violet-200',
    chip: 'border-violet-500/20 bg-black/20 text-violet-200',
  },
  sky: {
    wrap: 'border-sky-500/20 bg-sky-500/10',
    text: 'text-sky-200',
    chip: 'border-sky-500/20 bg-black/20 text-sky-200',
  },
};

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

export function DBAActionBoard({
  language,
  accent = 'cyan',
  title,
  focus,
  actions,
  caution,
}: DBAActionBoardProps) {
  const style = ACCENT_STYLE[accent];

  return (
    <div className={cn('rounded-3xl border p-5', style.wrap)}>
      <div className={cn('flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em]', style.text)}>
        <ActivitySquare className="h-4 w-4" />
        {pick(language, title)}
      </div>
      <p className="mt-3 text-sm leading-7 text-white/85">{pick(language, focus)}</p>

      <div className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <div key={`${pick(language, action)}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
              {language === 'es' ? `Accion ${index + 1}` : `Action ${index + 1}`}
            </div>
            <p className="mt-2 text-sm leading-7 text-white/75">{pick(language, action)}</p>
          </div>
        ))}
      </div>

      {caution ? (
        <div className={cn('mt-4 rounded-2xl border p-3', style.chip)}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
            <ShieldAlert className="h-3.5 w-3.5" />
            {language === 'es' ? 'Cuidado' : 'Caution'}
          </div>
          <p className="mt-2 text-sm leading-7 text-white/80">{pick(language, caution)}</p>
        </div>
      ) : null}
    </div>
  );
}
