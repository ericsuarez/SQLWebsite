import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, ChevronLeft, ChevronRight,
    Database, Code2, Search, Wrench, Activity, Layers,
    AlertTriangle, CheckCircle2, Clock, ArrowRight,
    Maximize2, Minimize2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { type RealCase, type ExecPhase, type LocalizedCaseText, CASE_RESOLUTION_SCRIPTS } from './realCasesData';
import { CopyCodeBlock } from '../Shared/CopyCodeBlock';

// ── phase config ─────────────────────────────────────────────────────────────
const PHASE_CFG: Record<ExecPhase, { dot: string; bg: string; text: string }> = {
    parse:    { dot: 'bg-blue-500',    bg: 'bg-blue-500/20',    text: 'text-blue-300' },
    bind:     { dot: 'bg-cyan-500',    bg: 'bg-cyan-500/20',    text: 'text-cyan-300' },
    optimize: { dot: 'bg-purple-500',  bg: 'bg-purple-500/20',  text: 'text-purple-300' },
    execute:  { dot: 'bg-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
    lock:     { dot: 'bg-amber-500',   bg: 'bg-amber-500/20',   text: 'text-amber-300' },
    wait:     { dot: 'bg-rose-500',    bg: 'bg-rose-500/20',    text: 'text-rose-300' },
    done:     { dot: 'bg-emerald-400', bg: 'bg-emerald-400/20', text: 'text-emerald-200' },
    error:    { dot: 'bg-red-500',     bg: 'bg-red-500/20',     text: 'text-red-300' },
};

const STATUS_STYLE: Record<string, string> = {
    running:    'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    suspended:  'border-rose-500/50    bg-rose-500/10    text-rose-300    animate-pulse',
    evicted:    'border-purple-500/40  bg-purple-500/10  text-purple-300',
    contention: 'border-amber-500/50   bg-amber-500/10   text-amber-300   animate-pulse',
    growth:     'border-yellow-500/50  bg-yellow-500/10  text-yellow-300  animate-pulse',
    virt:       'border-violet-500/50  bg-violet-500/10  text-violet-300  animate-pulse',
    idle:       'border-white/10       bg-white/5        text-white/30',
};
const DOT: Record<string, string> = {
    running: 'bg-emerald-400', suspended: 'bg-rose-400 animate-pulse', evicted: 'bg-purple-400',
    contention: 'bg-amber-400 animate-pulse', growth: 'bg-yellow-400 animate-pulse',
    virt: 'bg-violet-400 animate-pulse', idle: 'bg-white/20',
};

const COLOR_RING: Record<string, string> = {
    amber: 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    rose: 'border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.2)]',
    purple: 'border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    cyan: 'border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
    red: 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    orange: 'border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    yellow: 'border-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.2)]',
    blue: 'border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    violet: 'border-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.2)]',
    emerald: 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
};
const COLOR_TEXT: Record<string,string> = {
    amber:'text-amber-400', rose:'text-rose-400', purple:'text-purple-400', cyan:'text-cyan-400',
    red:'text-red-400', orange:'text-orange-400', yellow:'text-yellow-400', blue:'text-blue-400',
    violet:'text-violet-400', emerald:'text-emerald-400',
};
const COLOR_BG: Record<string,string> = {
    amber:'bg-amber-500/15', rose:'bg-rose-500/15', purple:'bg-purple-500/15', cyan:'bg-cyan-500/15',
    red:'bg-red-500/15', orange:'bg-orange-500/15', yellow:'bg-yellow-500/15', blue:'bg-blue-500/15',
    violet:'bg-violet-500/15', emerald:'bg-emerald-500/15',
};

function pick(language: 'en' | 'es', text: LocalizedCaseText) {
    return language === 'es' ? text.es : text.en;
}

function phaseLabel(language: 'en' | 'es', phase: ExecPhase) {
    const labels: Record<ExecPhase, { en: string; es: string }> = {
        parse: { en: 'Parse', es: 'Parseo' },
        bind: { en: 'Bind', es: 'Binding' },
        optimize: { en: 'Optimize', es: 'Optimizacion' },
        execute: { en: 'Execute', es: 'Ejecucion' },
        lock: { en: 'Lock', es: 'Bloqueo' },
        wait: { en: 'Wait', es: 'Espera' },
        done: { en: 'Done', es: 'Completado' },
        error: { en: 'Error', es: 'Error' },
    };

    return language === 'es' ? labels[phase].es : labels[phase].en;
}

function sessionStatusLabel(language: 'en' | 'es', status: string) {
    const labels: Record<string, { en: string; es: string }> = {
        running: { en: 'RUNNING', es: 'EJECUTANDO' },
        suspended: { en: 'SUSPENDED', es: 'SUSPENDIDO' },
        evicted: { en: 'EVICTED', es: 'EXPULSADO' },
        contention: { en: 'CONTENTION', es: 'CONTENCION' },
        growth: { en: 'AUTOGROWTH', es: 'AUTOCRECIMIENTO' },
        virt: { en: 'CPU READY', es: 'CPU READY' },
        idle: { en: 'IDLE', es: 'INACTIVO' },
    };

    return language === 'es' ? labels[status].es : labels[status].en;
}

function planStatusLabel(language: 'en' | 'es', status: 'cached' | 'evicted' | 'recompiling') {
    const labels = {
        cached: { en: 'plan: cached', es: 'plan: cacheado' },
        evicted: { en: 'plan: evicted', es: 'plan: expulsado' },
        recompiling: { en: 'plan: recompiling', es: 'plan: recompilando' },
    };

    return language === 'es' ? labels[status].es : labels[status].en;
}

// ── Section box component ─────────────────────────────────────────────────────
function SectionBox({ icon: Icon, label, accent, children, className }: {
    icon: React.ElementType; label: string; accent: string; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={cn('flex flex-col rounded-2xl border border-white/10 bg-black/30 overflow-hidden', className)}>
            <div className={cn('flex items-center gap-2 px-4 py-2.5 border-b border-white/10', accent)}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}

// ── Case card grid ────────────────────────────────────────────────────────────
function CaseGrid({ cases, onSelect }: { cases: RealCase[]; onSelect: (c: RealCase) => void }) {
    const { t, language } = useLanguage();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {cases.map(c => (
                <motion.button key={c.id} whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(c)}
                    className={cn('text-left flex flex-col gap-3 p-5 rounded-2xl border-2 glass-panel transition-all duration-200 cursor-pointer group', COLOR_RING[c.color])}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{c.icon}</span>
                        <div>
                            <div className={cn('font-bold text-sm', COLOR_TEXT[c.color])}>{t(c.nameKey as any)}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                    {c.steps.length} {language === 'es' ? 'pasos' : 'steps'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{t(c.descKey as any)}</p>
                    <div className="flex justify-end">
                        <span className={cn('text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all', COLOR_TEXT[c.color])}>
                            {t('explore')} <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}

// ── Pipeline bar ──────────────────────────────────────────────────────────────
function PipelineBar({ phase }: { phase?: ExecPhase }) {
    const { language } = useLanguage();
    const phases: ExecPhase[] = ['parse', 'bind', 'optimize', 'execute', 'lock', 'wait', 'done'];
    const activeIdx = phase ? phases.indexOf(phase) : -1;
    return (
        <div className="flex items-center gap-1 flex-wrap">
            {phases.map((p, i) => {
                const cfg = PHASE_CFG[p];
                const active = i === activeIdx;
                const past   = i < activeIdx;
                return (
                    <div key={p} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all duration-300',
                        active ? `${cfg.bg} ${cfg.text} border-current shadow-[0_0_10px_currentColor]` :
                        past   ? 'bg-white/10 text-white/40 border-white/10' : 'bg-transparent text-white/20 border-transparent')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', active ? cfg.dot : past ? 'bg-white/30' : 'bg-white/10')} />
                        {phaseLabel(language, p)}
                    </div>
                );
            })}
        </div>
    );
}

// ── Detail view ───────────────────────────────────────────────────────────────
function CaseDetail({ rc, onBack }: { rc: RealCase; onBack: () => void }) {
    const { t, language } = useLanguage();
    const [stepIdx, setStepIdx] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [activePanel, setActivePanel] = useState<'flow' | 'schema' | 'fix'>('flow');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const step = rc.steps[stepIdx];
    const total = rc.steps.length;

    const next = () => setStepIdx(i => Math.min(i + 1, total - 1));
    const prev = () => setStepIdx(i => Math.max(i - 1, 0));
    const reset = () => { setStepIdx(0); setPlaying(false); };

    useEffect(() => {
        if (playing) {
            timerRef.current = setInterval(() => {
                setStepIdx(i => {
                    if (i >= total - 1) { setPlaying(false); return i; }
                    return i + 1;
                });
            }, 2000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [playing, total]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === containerRef.current);
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    useEffect(() => {
        if (!isFullscreen) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
                void leaveFullscreen();
            }
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isFullscreen]);

    const resolution = CASE_RESOLUTION_SCRIPTS[rc.id];
    const clrText = COLOR_TEXT[rc.color];
    const clrBg = COLOR_BG[rc.color];

    const highlightLabel = (h: string | undefined) => {
        if (!h) return t('queryEvent');
        if (h === 'lock')  return t('lockContention');
        if (h === 'wait')  return t('waitDetected');
        if (h === 'io')    return t('ioBottleneck');
        if (h === 'plan')  return t('planIssue');
        return t('queryEvent');
    };

    const panels: [typeof activePanel, string][] = [
        ['flow', t('tabSimulation')],
        ['schema', t('tabSchemaQuery')],
        ['fix', t('tabDetectionFix')],
    ];
    const resolutionText = resolution ? pick(language, resolution) : t(rc.resolutionKey as any);
    const waitType = step.sqlos?.waitType ?? 'none';
    const needsPhysicalIo =
        step.highlight === 'io' ||
        /PAGEIOLATCH|ASYNC_IO|WRITELOG|IO_COMPLETION|LOGBUFFER/i.test(waitType);
    const overviewCards = [
        { label: t('rootCauseLabel'), value: t(rc.detailsKey as any) },
        { label: t('impactLabel'), value: t(rc.descKey as any) },
        { label: t('bestPracticeLabel'), value: t(rc.resolutionKey as any) },
    ];
    const flowCards = [
        {
            id: 'ingress',
            label: language === 'es' ? 'Entrada SQL' : 'SQL ingress',
            note: language === 'es' ? 'La consulta entra al parser y arranca el pipeline interno.' : 'The request enters the parser and starts the internal pipeline.',
            tone: 'done',
        },
        {
            id: 'compile',
            label: language === 'es' ? 'Compilacion' : 'Compile',
            note:
                step.phase === 'optimize'
                    ? language === 'es'
                        ? 'Optimizando y ajustando el plan'
                        : 'Optimizing and shaping the plan'
                    : language === 'es'
                        ? 'Parser, binding y optimizador preparando la ejecucion'
                        : 'Parser, binding and optimizer',
            tone: ['parse', 'bind', 'optimize'].includes(step.phase ?? '') ? 'active' : 'done',
        },
        {
            id: 'buffer',
            label: language === 'es' ? 'Buffer pool' : 'Buffer pool',
            note: needsPhysicalIo
                ? language === 'es'
                    ? 'La pagina no estaba en memoria'
                    : 'The page was not in memory'
                : language === 'es'
                    ? 'La pagina ya estaba cargada'
                    : 'The page was already cached',
            tone: needsPhysicalIo ? 'warn' : 'done',
        },
        {
            id: 'io',
            label: language === 'es' ? 'I/O fisico' : 'Physical I/O',
            note: needsPhysicalIo
                ? language === 'es'
                    ? 'Leyendo disco o endureciendo log'
                    : 'Reading from disk or hardening log'
                : language === 'es'
                    ? 'Sin lectura fisica critica'
                    : 'No critical physical read',
            tone: needsPhysicalIo ? 'active' : 'idle',
        },
        {
            id: 'state',
            label: language === 'es' ? 'Estado actual' : 'Current state',
            note:
                step.phase === 'done'
                    ? language === 'es'
                        ? 'Ejecucion completada'
                        : 'Execution completed'
                    : waitType !== 'none'
                        ? language === 'es'
                            ? `Espera ${waitType}`
                            : `Wait ${waitType}`
                        : language === 'es'
                            ? 'Consulta en progreso'
                            : 'Query in progress',
            tone: step.phase === 'done' ? 'done' : step.phase === 'error' ? 'warn' : 'active',
        },
    ] as const;
    const flowToneClass = (tone: 'done' | 'active' | 'warn' | 'idle') =>
        tone === 'done'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : tone === 'active'
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                : tone === 'warn'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-white/10 bg-black/20 text-white/50';

    const leaveFullscreen = async () => {
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch {
                // Ignore browser-specific fullscreen exit failures and fall back to state sync.
            }
        }
        setIsFullscreen(false);
    };

    const toggleFullscreen = async () => {
        const node = containerRef.current;
        if (!node) return;

        if (document.fullscreenElement === node || isFullscreen) {
            await leaveFullscreen();
            return;
        }

        try {
            await node.requestFullscreen();
            setIsFullscreen(true);
        } catch {
            // If fullscreen API is blocked, keep the state unchanged.
        }
    };

    const handleBack = async () => {
        if (document.fullscreenElement) {
            await leaveFullscreen();
        }
        onBack();
    };

    const content = (
        <div className={cn("flex flex-col h-full", isFullscreen ? "gap-3" : "gap-4")}>
            {/* Header bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => void handleBack()}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 border border-white/10">
                        <ChevronLeft className="w-4 h-4" /> {t('backToCases')}
                    </button>
                    <span className="text-2xl">{rc.icon}</span>
                    <h2 className={cn('text-xl font-bold', clrText)}>{t(rc.nameKey as any)}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* Panel switcher */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                        {panels.map(([id, lbl]) => (
                            <button key={id} onClick={() => setActivePanel(id)}
                                className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                    activePanel === id ? `${clrBg} ${clrText}` : 'text-muted-foreground hover:text-white')}>
                                {lbl}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => void toggleFullscreen()}
                        className={cn(
                            'rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white',
                            isFullscreen && 'bg-white/10 text-white',
                        )}
                        title={language === 'es' ? (isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa') : (isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen')}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">

                {/* ── FLOW PANEL ───────────────────────────────────────── */}
                {activePanel === 'flow' && (
                    <motion.div key="flow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex flex-col gap-4 flex-1 min-h-0">

                        {/* Step progress dots */}
                        <div className="flex items-center gap-2">
                            {rc.steps.map((_, i) => (
                                <button key={i} onClick={() => { setPlaying(false); setStepIdx(i); }}
                                    className={cn('h-2 rounded-full transition-all duration-300 cursor-pointer',
                                        i === stepIdx ? `w-8 ${clrText} bg-current` :
                                        i < stepIdx ? 'w-4 bg-white/30' : 'w-4 bg-white/10')} />
                            ))}
                            <span className="ml-auto text-xs text-muted-foreground font-mono">
                                {t('stepLabel')} {stepIdx + 1}/{total}
                            </span>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-3">
                            {overviewCards.map((card) => (
                                <div key={card.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{card.label}</div>
                                    <p className="mt-3 text-sm leading-7 text-white/80">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{t('executionPipeline')}</div>
                                <div className={cn('mt-2 text-lg font-black', clrText)}>
                                    {step.phase ? phaseLabel(language, step.phase) : language === 'es' ? 'Inactivo' : 'Idle'}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                                    {language === 'es' ? 'Sesiones' : 'SPIDs'}
                                </div>
                                <div className="mt-2 text-lg font-black text-cyan-300">{step.spids.length}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                                    {language === 'es' ? 'Espera' : 'Wait'}
                                </div>
                                <div className="mt-2 text-sm font-black text-rose-300">
                                    {step.sqlos?.waitType ?? (language === 'es' ? 'ninguna' : 'none')}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{t('bufferPool')}</div>
                                <div className="mt-2 text-lg font-black text-emerald-300">
                                    {step.buffer ? `${Math.round((step.buffer.usedPages / step.buffer.totalPages) * 100)}%` : '0%'}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 xl:grid-cols-5">
                            {flowCards.map((card) => (
                                <div
                                    key={card.id}
                                    className={cn('rounded-2xl border p-4 transition-all', flowToneClass(card.tone))}
                                >
                                    <div className="text-[10px] font-bold uppercase tracking-[0.18em]">{card.label}</div>
                                    <p className="mt-2 text-sm leading-relaxed text-white/80">{card.note}</p>
                                </div>
                            ))}
                        </div>

                        {/* Main 2-col grid */}
                        <div
                            className={cn(
                                "grid grid-cols-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] gap-4 flex-1 min-h-0",
                                isFullscreen ? "overflow-y-auto pb-2 pr-1" : "overflow-y-auto pb-6",
                            )}
                        >

                            {/* LEFT (Scrolls independently if needed via parent flex) */}
                            <div className="flex flex-col gap-4">
                                <SectionBox icon={Layers} label={t('executionPipeline')} accent="text-muted-foreground bg-black/20">
                                    <PipelineBar phase={step.phase} />
                                </SectionBox>

                                <AnimatePresence mode="wait">
                                    <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                        <SectionBox icon={Activity}
                                            label={`${t('stepLabel')} ${stepIdx + 1} - ${t('stepObservation')}`}
                                            accent={`${clrText} ${clrBg}`}>
                                            <p className="text-sm text-white/85 leading-relaxed">{t(step.logKey as any)}</p>
                                            {step.highlight && (
                                                <div className={cn('mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border',
                                                    step.highlight === 'lock'  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
                                                    step.highlight === 'wait'  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' :
                                                    step.highlight === 'io'    ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' :
                                                    step.highlight === 'plan'  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' :
                                                                                 'bg-white/5 border-white/10 text-white/60')}>
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    {highlightLabel(step.highlight)}
                                                </div>
                                            )}
                                        </SectionBox>
                                    </motion.div>
                                </AnimatePresence>

                                {step.sqlos && (
                                    <SectionBox icon={Layers} label={t('sqlosScheduler')} accent="text-violet-300 bg-violet-500/10">
                                        <div className="grid grid-cols-2 gap-3">
                                            {([
                                                [language === 'es' ? 'Schedulers' : 'Schedulers', step.sqlos.schedulers, 'text-violet-300'],
                                                [language === 'es' ? 'Workers' : 'Workers', step.sqlos.workers, 'text-blue-300'],
                                                [language === 'es' ? 'Runnable' : 'Runnable', step.sqlos.runnable, 'text-emerald-300'],
                                                [language === 'es' ? 'Suspendidos' : 'Suspended', step.sqlos.suspended, 'text-rose-300'],
                                            ] as [string, number, string][]).map(([k, v, c]) => (
                                                <div key={k} className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
                                                    <div className={cn('text-xl font-black', c)}>{v}</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">{k}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {step.sqlos.waitType && (
                                            <div className="mt-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2 text-rose-300 text-xs font-mono font-bold text-center">
                                                {language === 'es' ? 'Espera' : 'Wait'}: {step.sqlos.waitType} ({step.sqlos.waitMs}ms)
                                            </div>
                                        )}
                                    </SectionBox>
                                )}

                                {step.buffer && (
                                    <SectionBox icon={Database} label={t('bufferPool')} accent="text-cyan-300 bg-cyan-500/10">
                                        <div className="grid grid-cols-4 gap-2">
                                            {([
                                                [language === 'es' ? 'Total' : 'Total', step.buffer.totalPages, 'text-white/70'],
                                                [language === 'es' ? 'Usadas' : 'Used', step.buffer.usedPages, 'text-emerald-300'],
                                                [language === 'es' ? 'Sucias' : 'Dirty', step.buffer.dirtyPages, 'text-amber-300'],
                                                [language === 'es' ? 'Expulsadas' : 'Evicted', step.buffer.evictedPages, 'text-rose-300'],
                                            ] as [string, number, string][]).map(([k, v, c]) => (
                                                <div key={k} className="bg-black/40 rounded-xl p-2 text-center border border-white/5">
                                                    <div className={cn('text-lg font-black', c)}>{v}</div>
                                                    <div className="text-[9px] text-muted-foreground">{k}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs text-white/50">
                                                <span>{language === 'es' ? 'Paginas cargadas' : 'Pages loaded'}</span>
                                                <span>{step.buffer.usedPages}/{step.buffer.totalPages}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-white/10">
                                                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(step.buffer.usedPages / step.buffer.totalPages) * 100}%` }} />
                                            </div>
                                        </div>
                                    </SectionBox>
                                )}
                            </div>

                            {/* RIGHT: Session Monitor */}
                            <div className="flex flex-col gap-4">
                                <SectionBox icon={Activity} label={t('sessionMonitor')} accent="text-cyan-300 bg-cyan-500/10" className="h-full">
                                    <div className="flex flex-col gap-2">
                                        <AnimatePresence>
                                            {step.spids.map(s => (
                                                <motion.div key={s.spid}
                                                    layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                                                    className={cn('rounded-xl border p-3 flex flex-col gap-2', STATUS_STYLE[s.status] ?? STATUS_STYLE.idle)}>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', DOT[s.status] ?? DOT.idle)} />
                                                        <span className="font-mono text-xs font-black text-cyan-400 shrink-0">SPID {s.spid}</span>
                                                        {s.labelKey && <span className="text-xs text-white/70 flex-1 min-w-0 truncate">{t(s.labelKey as any)}</span>}
                                                        <span className={cn('ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                                                            s.status === 'running'    ? 'bg-emerald-500/20 text-emerald-400' :
                                                            s.status === 'suspended'  ? 'bg-rose-500/20 text-rose-400' :
                                                            s.status === 'contention' ? 'bg-amber-500/20 text-amber-400' :
                                                            s.status === 'virt'       ? 'bg-violet-500/20 text-violet-400' :
                                                                                        'bg-white/10 text-white/40')}>
                                                            {sessionStatusLabel(language, s.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {s.waitType && (
                                                            <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                                                                ⏳ {s.waitType}
                                                            </span>
                                                        )}
                                                        {s.blockedBy && (
                                                            <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md text-[10px] font-mono">
                                                                {language === 'es' ? 'bloqueado por SPID' : 'blocked by SPID'} {s.blockedBy}
                                                            </span>
                                                        )}
                                                        {s.planStatus && (
                                                            <span className={cn('px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold',
                                                                s.planStatus === 'cached'  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
                                                                s.planStatus === 'evicted' ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' :
                                                                                             'bg-amber-500/20 border-amber-500/30 text-amber-300 animate-pulse')}>
                                                                {planStatusLabel(language, s.planStatus)}
                                                            </span>
                                                        )}
                                                        {s.extra && (
                                                            <span className="bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded-md text-[10px] font-mono">
                                                                {s.extra}
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </SectionBox>
                            </div>
                        </div>

                        {/* Controls — docked inside the panel, never overlap, shrink-0 prevents compressing */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 bg-black/20 shrink-0 -mx-0 rounded-xl px-3 pb-3">
                            <button
                                onClick={reset}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors"
                                title={language === 'es' ? 'Reiniciar simulacion' : 'Reset simulation'}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setPlaying(false); prev(); }} disabled={stepIdx === 0}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-xl disabled:opacity-30 transition-all border border-white/10">
                                    <ChevronLeft className="w-4 h-4" /> {t('prevBtn')}
                                </button>
                                <button onClick={() => setPlaying(p => !p)}
                                    className={cn('px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border',
                                        playing ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : `${clrBg} ${clrText} border-current/30`)}>
                                    {playing
                                        ? <><Pause className="w-4 h-4" /> {t('pauseBtn')}</>
                                        : <><Play  className="w-4 h-4" /> {t('autoPlay')}</>
                                    }
                                </button>
                                <button onClick={() => { setPlaying(false); next(); }} disabled={stepIdx === total - 1}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-xl disabled:opacity-30 transition-all border border-white/10">
                                    {t('nextBtn')} <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className={cn('text-xs font-bold px-3 py-1.5 rounded-lg border', clrBg, clrText)}>
                                {stepIdx === total - 1
                                    ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {t('complete')}</span>
                                    : `${stepIdx + 1} / ${total}`
                                }
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── SCHEMA PANEL ──────────────────────────────────────── */}
                {activePanel === 'schema' && (
                    <motion.div key="schema" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <SectionBox icon={Database} label={t('tableSchema')} accent="text-emerald-300 bg-emerald-500/10">
                            <CopyCodeBlock code={pick(language, rc.schema)} accent="emerald" />
                        </SectionBox>
                        <SectionBox icon={Code2} label={t('problematicQuery')} accent="text-amber-300 bg-amber-500/10">
                            <CopyCodeBlock code={pick(language, rc.query)} accent="amber" />
                        </SectionBox>
                    </motion.div>
                )}

                {/* ── FIX PANEL ─────────────────────────────────────────── */}
                {activePanel === 'fix' && (
                    <motion.div key="fix" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <SectionBox icon={Search} label={t('detectionTsql')} accent="text-blue-300 bg-blue-500/10">
                            <CopyCodeBlock code={pick(language, rc.detectionQuery)} accent="blue" />
                        </SectionBox>
                        <SectionBox icon={Wrench} label={t('resolutionBestPractice')} accent="text-emerald-300 bg-emerald-500/10">
                            <CopyCodeBlock code={resolutionText} accent="emerald" />
                        </SectionBox>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
    return (
        <div
            ref={containerRef}
            className={cn(
                'h-full',
                isFullscreen && 'bg-zinc-950 px-4 py-4 md:px-6 md:py-6'
            )}
        >
            <div className={cn('mx-auto h-full', isFullscreen && 'max-w-[1700px]')}>
                <div
                    className={cn(
                        'h-full',
                        isFullscreen && 'rounded-3xl border border-white/10 bg-background/80 p-4 shadow-glass backdrop-blur-xl md:p-6'
                    )}
                >
                    {content}
                </div>
            </div>
        </div>
    );
}

// ── Public component ──────────────────────────────────────────────────────────
export function RealCaseScenario({ cases, onFocusChange }: {
    cases: RealCase[];
    onFocusChange?: (v: boolean) => void;
}) {
    const [selected, setSelected] = useState<RealCase | null>(null);

    const select = (c: RealCase) => { setSelected(c); onFocusChange?.(true); };
    const back   = ()            => { setSelected(null); onFocusChange?.(false); };

    return (
        <AnimatePresence mode="wait">
            {selected
                ? <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                    <CaseDetail rc={selected} onBack={back} />
                  </motion.div>
                : <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <CaseGrid cases={cases} onSelect={select} />
                  </motion.div>
            }
        </AnimatePresence>
    );
}
