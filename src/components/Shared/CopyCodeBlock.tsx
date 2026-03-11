import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';

interface CopyCodeBlockProps {
  code: string;
  accent?: 'emerald' | 'amber' | 'blue' | 'violet' | 'rose' | 'cyan';
  className?: string;
}

const ACCENT_STYLES = {
  emerald: {
    wrap: 'border-emerald-500/20 bg-emerald-500/5',
    glow: 'from-emerald-500/10',
    text: 'text-emerald-300',
  },
  amber: {
    wrap: 'border-amber-500/20 bg-amber-500/5',
    glow: 'from-amber-500/10',
    text: 'text-amber-300',
  },
  blue: {
    wrap: 'border-blue-500/20 bg-blue-500/5',
    glow: 'from-blue-500/10',
    text: 'text-blue-300',
  },
  violet: {
    wrap: 'border-violet-500/20 bg-violet-500/5',
    glow: 'from-violet-500/10',
    text: 'text-violet-300',
  },
  rose: {
    wrap: 'border-rose-500/20 bg-rose-500/5',
    glow: 'from-rose-500/10',
    text: 'text-rose-300',
  },
  cyan: {
    wrap: 'border-cyan-500/20 bg-cyan-500/5',
    glow: 'from-cyan-500/10',
    text: 'text-cyan-300',
  },
} as const;

export function CopyCodeBlock({
  code,
  accent = 'emerald',
  className,
}: CopyCodeBlockProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const style = ACCENT_STYLES[accent];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('copy failed', error);
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-black/50',
        style.wrap,
        className,
      )}
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent', style.glow)} />
      <div className="relative flex items-center justify-end border-b border-white/10 px-3 py-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
      <pre className={cn('relative overflow-x-auto px-4 py-4 text-[11px] leading-relaxed', style.text)}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
