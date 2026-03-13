import { Eye, GraduationCap, Target } from 'lucide-react';
import type { LocalizedText } from '../../data/advancedSQLData';
import { cn } from '../../lib/utils';

interface GuidedLabStep {
  title: LocalizedText;
  detail: LocalizedText;
}

interface GuidedLabPanelProps {
  language: 'en' | 'es';
  title: LocalizedText;
  objective: LocalizedText;
  watchItems: LocalizedText[];
  steps: readonly GuidedLabStep[];
  currentStep: number;
  footer?: LocalizedText;
  compact?: boolean;
  accent?: 'amber' | 'cyan' | 'emerald' | 'rose' | 'lime' | 'sky';
  onStepSelect?: (index: number) => void;
}

const ACCENT_STYLE: Record<NonNullable<GuidedLabPanelProps['accent']>, { border: string; bg: string; text: string }> = {
  amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-200' },
  cyan: { border: 'border-cyan-500/20', bg: 'bg-cyan-500/10', text: 'text-cyan-200' },
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-200' },
  rose: { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-200' },
  lime: { border: 'border-lime-500/20', bg: 'bg-lime-500/10', text: 'text-lime-200' },
  sky: { border: 'border-sky-500/20', bg: 'bg-sky-500/10', text: 'text-sky-200' },
};

function pick(language: 'en' | 'es', text: LocalizedText) {
  return language === 'es' ? text.es : text.en;
}

export function GuidedLabPanel({
  language,
  title,
  objective,
  watchItems,
  steps,
  currentStep,
  footer,
  compact = false,
  accent = 'cyan',
  onStepSelect,
}: GuidedLabPanelProps) {
  const style = ACCENT_STYLE[accent];

  return (
    <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]')}>
      <div className={cn('rounded-3xl border p-5', style.border, style.bg)}>
        <div className={cn('flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]', style.text)}>
          <GraduationCap className="h-4 w-4" />
          {pick(language, title)}
        </div>
        <p className="mt-4 text-sm leading-7 text-white/85">{pick(language, objective)}</p>

        <div className="mt-5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
            <Eye className="h-4 w-4" />
            {language === 'es' ? 'Qué tienes que mirar' : 'What to watch'}
          </div>
          <div className="mt-3 grid gap-2">
            {watchItems.map((item, index) => (
              <div key={`${pick(language, item)}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/75">
                {pick(language, item)}
              </div>
            ))}
          </div>
        </div>

        {footer ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/70">
            {pick(language, footer)}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
          <Target className="h-4 w-4" />
          {language === 'es' ? 'Secuencia guiada' : 'Guided sequence'}
        </div>
        <div className="mt-4 grid gap-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            return (
              <button
                key={`${pick(language, step.title)}-${index}`}
                type="button"
                onClick={() => onStepSelect?.(index)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all',
                  onStepSelect ? 'cursor-pointer' : 'cursor-default',
                  isActive
                    ? cn(style.border, style.bg)
                    : 'border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.04]'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-white">
                    {language === 'es' ? `Paso ${index + 1}` : `Step ${index + 1}`}
                  </div>
                  <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]', isActive ? `${style.border} ${style.bg} ${style.text}` : 'border-white/10 bg-black/20 text-white/45')}>
                    {isActive ? (language === 'es' ? 'ahora' : 'now') : index < currentStep ? (language === 'es' ? 'hecho' : 'ok') : language === 'es' ? 'siguiente' : 'next'}
                  </span>
                </div>
                <div className="mt-2 text-sm font-bold text-white/85">{pick(language, step.title)}</div>
                <p className="mt-2 text-sm leading-7 text-white/65">{pick(language, step.detail)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
