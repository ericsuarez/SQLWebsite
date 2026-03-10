import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Cpu, Database, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { type RealCase, type ExecPhase, CASE_RESOLUTION_SCRIPTS } from './realCasesData';

// ─────────────────────────── Helpers ────────────────────────────────────────
const PHASE_LABELS: Record<ExecPhase, string> = {
    parse: 'Parse', bind: 'Bind', optimize: 'Optimize',
    execute: 'Execute', lock: 'Lock', wait: 'Wait', done: 'Done', error: 'Error',
};
const PHASE_COLOR: Record<ExecPhase, string> = {
    parse: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    bind: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    optimize: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    execute: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    lock: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    wait: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    done: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60',
    error: 'bg-red-500/20 text-red-300 border-red-500/40',
};
const PHASE_ACTIVE: Record<ExecPhase, string> = {
    parse: 'bg-blue-500 text-white shadow-[0_0_14px_#3b82f6]',
    bind: 'bg-cyan-500 text-white shadow-[0_0_14px_#06b6d4]',
    optimize: 'bg-purple-500 text-white shadow-[0_0_14px_#a855f7]',
    execute: 'bg-emerald-500 text-white shadow-[0_0_14px_#10b981]',
    lock: 'bg-amber-500 text-white shadow-[0_0_14px_#f59e0b]',
    wait: 'bg-rose-500 text-white shadow-[0_0_14px_#f43f5e]',
    done: 'bg-emerald-400 text-white shadow-[0_0_14px_#34d399]',
    error: 'bg-red-500 text-white shadow-[0_0_14px_#ef4444]',
};

const STATUS_STYLE: Record<string, string> = {
    running: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    suspended: 'bg-rose-500/15 border-rose-500/50 text-rose-300 animate-pulse',
    evicted: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    idle: 'bg-white/5 border-white/10 text-white/30 opacity-50',
    contention: 'bg-amber-500/15 border-amber-500/50 text-amber-300 animate-pulse',
    growth: 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300 animate-pulse',
    virt: 'bg-violet-500/15 border-violet-500/50 text-violet-300 animate-pulse',
};

const COLOR: Record<string, { ring: string; bg: string; text: string; glow: string }> = {
    amber: { ring: 'border-amber-500/50', bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-[0_0_16px_rgba(245,158,11,0.4)]' },
    rose: { ring: 'border-rose-500/50', bg: 'bg-rose-500/20', text: 'text-rose-400', glow: 'shadow-[0_0_16px_rgba(244,63,94,0.4)]' },
    purple: { ring: 'border-purple-500/50', bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-[0_0_16px_rgba(168,85,247,0.4)]' },
    cyan: { ring: 'border-cyan-500/50', bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-[0_0_16px_rgba(6,182,212,0.4)]' },
    red: { ring: 'border-red-500/50', bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-[0_0_16px_rgba(239,68,68,0.4)]' },
    orange: { ring: 'border-orange-500/50', bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'shadow-[0_0_16px_rgba(249,115,22,0.4)]' },
    yellow: { ring: 'border-yellow-500/50', bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-[0_0_16px_rgba(234,179,8,0.4)]' },
    blue: { ring: 'border-blue-500/50', bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'shadow-[0_0_16px_rgba(59,130,246,0.4)]' },
    violet: { ring: 'border-violet-500/50', bg: 'bg-violet-500/20', text: 'text-violet-400', glow: 'shadow-[0_0_16px_rgba(139,92,246,0.4)]' },
    emerald: { ring: 'border-emerald-500/50', bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-[0_0_16px_rgba(16,185,129,0.4)]' },
};

// ─────────────────────────── Sub-components ─────────────────────────────────

function SqlPanel({ label, code, accent }: { label: string; code: string; accent: string }) {
    return (
        <div className="flex flex-col h-full">
            <div className={cn('text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-t-lg border-b border-white/10', accent)}>{label}</div>
            <pre className="flex-1 text-[11px] leading-relaxed p-3 bg-black/50 rounded-b-lg overflow-auto font-mono text-white/80 whitespace-pre-wrap break-all border border-t-0 border-white/5">{code}</pre>
        </div>
    );
}

function SpidRow({ s }: { s: { spid: number; label?: string; status: string; waitType?: string; blockedBy?: number; planStatus?: string } }) {
    return (
        <motion.div layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
            className={cn('flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-bold', STATUS_STYLE[s.status] ?? STATUS_STYLE.idle)}>
            <span className="font-mono text-cyan-400 w-14 shrink-0">SPID {s.spid}</span>
            <span className="flex-1 mx-2 text-white/60 truncate text-[11px]">{s.label ?? ''}</span>
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {s.waitType && <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-mono">{s.waitType}</span>}
                {s.blockedBy && <span className="text-amber-300 text-[10px]">← {s.blockedBy}</span>}
                {s.planStatus && (
                    <span className={cn('px-1.5 py-0.5 rounded border text-[10px] font-mono',
                        s.planStatus === 'cached' ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' :
                            s.planStatus === 'evicted' ? 'text-rose-300 bg-rose-500/20 border-rose-500/30' :
                                'text-amber-300 bg-amber-500/20 border-amber-500/30 animate-pulse'
                    )}>PLAN:{s.planStatus.toUpperCase()}</span>
                )}
                <span className={cn('px-1.5 py-0.5 rounded uppercase text-[10px]',
                    s.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' :
                        s.status === 'suspended' ? 'bg-rose-500/20 text-rose-400 animate-pulse' :
                            s.status === 'evicted' ? 'bg-purple-500/20 text-purple-400' :
                                s.status === 'contention' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                                    s.status === 'growth' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
                                        s.status === 'virt' ? 'bg-violet-500/20 text-violet-400 animate-pulse' :
                                            'bg-white/10 text-white/40')}>{s.status}</span>
            </div>
        </motion.div>
    );
}

function SqlosPanel({ sqlos }: { sqlos: RealCase['steps'][0]['sqlos'] }) {
    if (!sqlos) return null;
    const { schedulers, workers, runnable, suspended, waitType, waitMs } = sqlos;

    return (
        <div className="bg-black/30 rounded-xl border border-white/5 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">SQLOS — Schedulers & Workers</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
                {[['Schedulers', schedulers, 'text-white'], ['Workers', workers, 'text-blue-300'], ['Runnable', runnable, 'text-emerald-300'], ['Suspended', suspended, suspended > 0 ? 'text-rose-400' : 'text-muted-foreground']].map(([lbl, val, col]) => (
                    <div key={lbl as string} className="bg-black/40 rounded-lg p-2 border border-white/5">
                        <div className={cn('text-lg font-black', col as string)}>{val}</div>
                        <div className="text-[9px] text-muted-foreground uppercase">{lbl as string}</div>
                    </div>
                ))}
            </div>
            {/* Scheduler heat map */}
            <div className="flex gap-1 flex-wrap">
                {Array.from({ length: Math.min(schedulers as number, 16) }).map((_, i) => {
                    const isRunnable = i < (runnable as number);
                    const isSuspended = !isRunnable && i < (runnable as number) + (suspended as number);
                    return (
                        <div key={i} title={isRunnable ? 'RUNNABLE' : isSuspended ? 'SUSPENDED' : 'IDLE'}
                            className={cn('w-6 h-6 rounded border text-[9px] flex items-center justify-center font-mono',
                                isRunnable ? 'bg-emerald-500/30 border-emerald-500/40 text-emerald-300' :
                                    isSuspended ? 'bg-rose-500/30 border-rose-500/40 text-rose-300 animate-pulse' :
                                        'bg-white/5 border-white/10 text-white/20')}>
                            {i + 1}
                        </div>
                    );
                })}
            </div>
            {waitType && (
                <div className="flex items-center gap-2 text-xs bg-black/40 px-3 py-1.5 rounded-lg border border-rose-500/20">
                    <Activity className="w-3 h-3 text-rose-400" />
                    <span className="text-rose-300 font-mono">{waitType}</span>
                    {waitMs && <span className="ml-auto text-muted-foreground">{(waitMs / 1000).toFixed(1)}s</span>}
                </div>
            )}
        </div>
    );
}

function BufferPanel({ buf }: { buf: RealCase['steps'][0]['buffer'] }) {
    if (!buf) return null;
    const { totalPages, usedPages, dirtyPages, evictedPages } = buf;
    const cleanPages = usedPages - dirtyPages;
    const cleanPct = (cleanPages / totalPages) * 100;
    const dirtyPct = (dirtyPages / totalPages) * 100;
    return (
        <div className="bg-black/30 rounded-xl border border-white/5 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Buffer Pool</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{totalPages.toLocaleString()} pages total</span>
            </div>
            {/* Stacked bar */}
            <div className="h-5 rounded-full overflow-hidden bg-white/5 border border-white/10 flex">
                <motion.div className="bg-emerald-500/60 h-full" animate={{ width: `${cleanPct}%` }} />
                <motion.div className="bg-amber-500/70 h-full" animate={{ width: `${dirtyPct}%` }} />
                <motion.div className="bg-white/5 h-full flex-1" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5">
                    <div className="font-black text-emerald-300">{cleanPages.toLocaleString()}</div>
                    <div className="text-muted-foreground">Clean</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-1.5">
                    <div className="font-black text-amber-300">{dirtyPages.toLocaleString()}</div>
                    <div className="text-muted-foreground">Dirty</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-1.5">
                    <div className="font-black text-white/50">{(totalPages - usedPages).toLocaleString()}</div>
                    <div className="text-muted-foreground">Free</div>
                </div>
            </div>
            {evictedPages > 0 && (
                <div className="flex items-center gap-2 text-[10px] bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                    <span className="text-rose-400">⚠ Lazy Writer evicted {evictedPages.toLocaleString()} pages</span>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────── Main component ─────────────────────────────────
interface Props {
    cases: RealCase[];
}

export function RealCaseScenario({ cases }: Props) {
    const { t } = useLanguage();
    const [caseIdx, setCaseIdx] = useState(0);
    const [stepIdx, setStepIdx] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [activePanel, setActivePanel] = useState<'schema' | 'query' | 'detection' | 'resolution'>('schema');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const rc = cases[caseIdx];
    const step = rc.steps[stepIdx];
    const totalSteps = rc.steps.length;
    const c = COLOR[rc.color];

    const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
    const resetCase = () => { stopTimer(); setStepIdx(0); setPlaying(false); };

    const startAuto = () => {
        setPlaying(true);
        timerRef.current = setInterval(() => {
            setStepIdx(p => {
                if (p >= totalSteps - 1) { stopTimer(); setPlaying(false); return p; }
                return p + 1;
            });
        }, 2400);
    };

    const handlePlay = () => {
        if (playing) { stopTimer(); setPlaying(false); return; }
        if (stepIdx >= totalSteps - 1) setStepIdx(0);
        startAuto();
    };

    useEffect(() => { resetCase(); setActivePanel('schema'); }, [caseIdx]);
    useEffect(() => () => stopTimer(), []);

    return (
        <div className="flex flex-col gap-4">
            {/* Case pill row */}
            <div className="flex flex-wrap gap-2">
                {cases.map((rc2, i) => {
                    const col2 = COLOR[rc2.color];
                    return (
                        <button key={rc2.id} onClick={() => setCaseIdx(i)}
                            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all',
                                caseIdx === i ? `${col2.bg} ${col2.text} ${col2.ring} ${col2.glow}` : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10')}>
                            <span>{rc2.icon}</span>{t(rc2.nameKey as any)}
                        </button>
                    );
                })}
            </div>

            {/* Main panel */}
            <div className={cn('rounded-2xl border-2 overflow-hidden bg-black/20', c.ring, c.glow)}>
                {/* Header */}
                <div className={cn('px-5 py-4 border-b border-white/10', c.bg)}>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">{rc.icon}</span>
                        <h4 className={cn('text-lg font-black', c.text)}>{t(rc.nameKey as any)}</h4>
                    </div>
                    <p className="text-sm text-white/70">{t(rc.descKey as any)}</p>
                </div>

                {/* Body — 3 column layout */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] divide-y xl:divide-y-0 xl:divide-x divide-white/5">

                    {/* ── LEFT: Code Panels ── */}
                    <div className="flex flex-col gap-0 p-0 min-h-0">
                        {/* Tab selector */}
                        <div className="flex border-b border-white/5 bg-black/20">
                            {(['schema', 'query', 'detection', 'resolution'] as const).map(tab => (
                                <button key={tab} onClick={() => setActivePanel(tab)}
                                    className={cn('px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex-1 transition-colors',
                                        activePanel === tab ? `${c.text} border-b-2 ${c.ring} bg-white/5` : 'text-muted-foreground hover:text-white/60')}>
                                    {tab === 'schema' ? 'Schema' : tab === 'query' ? 'Query' : tab === 'detection' ? 'Detect' : 'Fix'}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 min-h-64 max-h-96 overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div key={activePanel} className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <SqlPanel
                                        label={activePanel === 'schema' ? 'Table Schema' : activePanel === 'query' ? 'Problematic Query' : activePanel === 'detection' ? 'DBA Detection T-SQL' : 'Resolution Script'}
                                        code={activePanel === 'schema' ? rc.schema : activePanel === 'query' ? rc.query : activePanel === 'detection' ? rc.detectionQuery : CASE_RESOLUTION_SCRIPTS[rc.id]}
                                        accent={activePanel === 'detection' ? 'text-cyan-400 bg-cyan-500/10' : activePanel === 'resolution' ? 'text-amber-400 bg-amber-500/10' : `${c.text} ${c.bg}`}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── CENTRE: Step player + SPID cards ── */}
                    <div className="p-4 flex flex-col gap-3">
                        {/* Execution pipeline */}
                        <div className="flex gap-1 flex-wrap">
                            {(['parse', 'bind', 'optimize', 'execute', step.phase === 'lock' || step.phase === 'wait' || step.phase === 'error' ? step.phase : 'done'] as ExecPhase[]).filter((v, i, a) => a.indexOf(v) === i).map(ph => (
                                <span key={ph} className={cn('px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all', step.phase === ph ? PHASE_ACTIVE[ph] : PHASE_COLOR[ph] ?? 'bg-white/5 border-white/10 text-muted-foreground')}>
                                    {PHASE_LABELS[ph]}
                                </span>
                            ))}
                        </div>

                        {/* Progress */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-bold">{t('stepLabel')} {stepIdx + 1}/{totalSteps}</span>
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div className={cn('h-full rounded-full', c.bg.replace('/20', ''))} animate={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }} />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5">
                            <button onClick={resetCase} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground transition-colors"><RotateCcw className="w-3 h-3" /></button>
                            <button disabled={stepIdx === 0} onClick={() => { stopTimer(); setPlaying(false); setStepIdx(p => Math.max(0, p - 1)); }}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold disabled:opacity-30 flex items-center gap-1 text-muted-foreground transition-colors">
                                <ChevronLeft className="w-3 h-3" />{t('stepPrev')}
                            </button>
                            <button onClick={handlePlay}
                                className={cn('px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 flex-1 justify-center transition-all', c.bg, c.text, c.ring)}>
                                {playing ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" />{t('autoPlay')}</>}
                            </button>
                            <button disabled={stepIdx >= totalSteps - 1} onClick={() => { stopTimer(); setPlaying(false); setStepIdx(p => Math.min(totalSteps - 1, p + 1)); }}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold disabled:opacity-30 flex items-center gap-1 text-muted-foreground transition-colors">
                                {t('stepNext')}<ChevronRight className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Log */}
                        <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 min-h-12 flex items-start font-mono text-[11px]">
                            <AnimatePresence mode="wait">
                                <motion.div key={stepIdx} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} className="text-white/90 leading-relaxed">
                                    <span className="text-cyan-600 mr-1">[{stepIdx + 1}/{totalSteps}]</span>{step.log}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* SPID cards */}
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Session Monitor</span>
                            <AnimatePresence mode="popLayout">
                                {step.spids.map(s => <SpidRow key={s.spid} s={s} />)}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── RIGHT: SQLOS + Buffer ── */}
                    <div className="p-4 flex flex-col gap-3 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            <motion.div key={stepIdx} className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <SqlosPanel sqlos={step.sqlos} />
                                <BufferPanel buf={step.buffer} />
                                {/* Best practice pill */}
                                <div className={cn('p-3 rounded-xl border text-[11px] leading-relaxed', c.bg, c.ring, c.text)}>
                                    <div className="font-bold text-[10px] uppercase tracking-wider mb-1">{t('bestPracticeLabel')}</div>
                                    <div className="text-white/70">{t(rc.resolutionKey as any)}</div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
