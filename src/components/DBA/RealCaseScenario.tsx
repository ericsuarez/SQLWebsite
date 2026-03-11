import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, ChevronLeft, ChevronRight,
    Database, Code2, Search, Wrench, Activity, Layers,
    AlertTriangle, CheckCircle2, Clock, ArrowRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { type RealCase, type ExecPhase, CASE_RESOLUTION_SCRIPTS } from './realCasesData';

// ── phase config ─────────────────────────────────────────────────────────────
const PHASE_CFG: Record<ExecPhase, { label: string; dot: string; bg: string; text: string }> = {
    parse:    { label: 'Parse',    dot: 'bg-blue-500',    bg: 'bg-blue-500/20',    text: 'text-blue-300' },
    bind:     { label: 'Bind',     dot: 'bg-cyan-500',    bg: 'bg-cyan-500/20',    text: 'text-cyan-300' },
    optimize: { label: 'Optimize', dot: 'bg-purple-500',  bg: 'bg-purple-500/20',  text: 'text-purple-300' },
    execute:  { label: 'Execute',  dot: 'bg-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
    lock:     { label: 'Lock',     dot: 'bg-amber-500',   bg: 'bg-amber-500/20',   text: 'text-amber-300' },
    wait:     { label: 'Wait',     dot: 'bg-rose-500',    bg: 'bg-rose-500/20',    text: 'text-rose-300' },
    done:     { label: 'Done',     dot: 'bg-emerald-400', bg: 'bg-emerald-400/20', text: 'text-emerald-200' },
    error:    { label: 'Error',    dot: 'bg-red-500',     bg: 'bg-red-500/20',     text: 'text-red-300' },
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

// ── Section box component ─────────────────────────────────────────────────────
function SectionBox({ icon: Icon, label, accent, children, className }: {
    icon: any; label: string; accent: string; children: React.ReactNode; className?: string;
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
    const { t } = useLanguage();
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
                                <span className="text-[10px] text-muted-foreground">{c.steps.length} steps</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{t(c.descKey as any)}</p>
                    <div className="flex justify-end">
                        <span className={cn('text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all', COLOR_TEXT[c.color])}>
                            Explorar <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}

// ── Pipeline bar ──────────────────────────────────────────────────────────────
function PipelineBar({ phase }: { phase?: ExecPhase }) {
    const phases: ExecPhase[] = ['parse', 'bind', 'optimize', 'execute', 'lock', 'wait', 'done'];
    const activeIdx = phase ? phases.indexOf(phase) : -1;
    return (
        <div className="flex items-center gap-1">
            {phases.map((p, i) => {
                const cfg = PHASE_CFG[p];
                const active = i === activeIdx;
                const past   = i < activeIdx;
                return (
                    <div key={p} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all duration-300',
                        active ? `${cfg.bg} ${cfg.text} border-current shadow-[0_0_10px_currentColor]` :
                        past   ? 'bg-white/10 text-white/40 border-white/10' : 'bg-transparent text-white/20 border-transparent')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', active ? cfg.dot : past ? 'bg-white/30' : 'bg-white/10')} />
                        {cfg.label}
                    </div>
                );
            })}
        </div>
    );
}

// ── Detail view ───────────────────────────────────────────────────────────────
function CaseDetail({ rc, onBack }: { rc: RealCase; onBack: () => void }) {
    const { t } = useLanguage();
    const [stepIdx, setStepIdx] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [activePanel, setActivePanel] = useState<'flow' | 'schema' | 'fix'>('flow');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const resolution = CASE_RESOLUTION_SCRIPTS[rc.id];
    const clrText = COLOR_TEXT[rc.color];
    const clrBg = COLOR_BG[rc.color];

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={onBack}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 border border-white/10">
                        <ChevronLeft className="w-4 h-4" /> {t('backToCases')}
                    </button>
                    <span className="text-2xl">{rc.icon}</span>
                    <h2 className={cn('text-xl font-bold', clrText)}>{t(rc.nameKey as any)}</h2>
                </div>
                {/* Panel switcher */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                    {([['flow', 'Simulación'], ['schema', 'Schema & Query'], ['fix', 'Detección & Fix']] as [typeof activePanel, string][]).map(([id, lbl]) => (
                        <button key={id} onClick={() => setActivePanel(id)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                activePanel === id ? `${clrBg} ${clrText}` : 'text-muted-foreground hover:text-white')}>
                            {lbl}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">

                {/* ── FLOW PANEL ───────────────────────────────────────── */}
                {activePanel === 'flow' && (
                    <motion.div key="flow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex flex-col gap-4 flex-1 min-h-0">

                        {/* Step progress */}
                        <div className="flex items-center gap-2">
                            {rc.steps.map((_, i) => (
                                <button key={i} onClick={() => { setPlaying(false); setStepIdx(i); }}
                                    className={cn('h-2 rounded-full transition-all duration-300 cursor-pointer',
                                        i === stepIdx ? `w-8 ${clrBg.replace('/15','').replace('/10','')} bg-current ${clrText}` :
                                        i < stepIdx ? 'w-4 bg-white/30' : 'w-4 bg-white/10')} />
                            ))}
                            <span className="ml-auto text-xs text-muted-foreground font-mono">Step {stepIdx + 1}/{total}</span>
                        </div>

                        {/* Main grid: 2 columns */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">

                            {/* LEFT: Phase pipeline + Step log */}
                            <div className="flex flex-col gap-4">
                                {/* Pipeline */}
                                <SectionBox icon={Layers} label="Execution Pipeline" accent="text-muted-foreground bg-black/20">
                                    <PipelineBar phase={step.phase} />
                                </SectionBox>

                                {/* Step log */}
                                <AnimatePresence mode="wait">
                                    <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                        <SectionBox icon={Activity} label={`Paso ${stepIdx + 1} — Observación`} accent={`${clrText} ${clrBg}`}>
                                            <p className="text-sm text-white/80 leading-relaxed">{step.log}</p>
                                            {step.highlight && (
                                                <div className={cn('mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border',
                                                    step.highlight === 'lock'  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
                                                    step.highlight === 'wait'  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' :
                                                    step.highlight === 'io'    ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' :
                                                    step.highlight === 'plan'  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' :
                                                                                 'bg-white/5 border-white/10 text-white/60')}>
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    {step.highlight === 'lock'  ? 'Lock Contention' :
                                                     step.highlight === 'wait'  ? 'Wait Detected' :
                                                     step.highlight === 'io'    ? 'I/O Bottleneck' :
                                                     step.highlight === 'plan'  ? 'Plan Issue' : 'Query Event'}
                                                </div>
                                            )}
                                        </SectionBox>
                                    </motion.div>
                                </AnimatePresence>

                                {/* SQLOS / Buffer panels if present */}
                                {step.sqlos && (
                                    <SectionBox icon={Layers} label="SQLOS Scheduler" accent="text-violet-300 bg-violet-500/10">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                ['Schedulers', step.sqlos.schedulers, 'text-violet-300'],
                                                ['Workers', step.sqlos.workers, 'text-blue-300'],
                                                ['Runnable', step.sqlos.runnable, 'text-emerald-300'],
                                                ['Suspended', step.sqlos.suspended, 'text-rose-300'],
                                            ].map(([k, v, c]) => (
                                                <div key={k as string} className="bg-black/40 rounded-xl p-3 text-center border border-white/5">
                                                    <div className={cn('text-xl font-black', c)}>{v}</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">{k}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {step.sqlos.waitType && (
                                            <div className="mt-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2 text-rose-300 text-xs font-mono font-bold text-center">
                                                Wait: {step.sqlos.waitType} ({step.sqlos.waitMs}ms)
                                            </div>
                                        )}
                                    </SectionBox>
                                )}

                                {step.buffer && (
                                    <SectionBox icon={Database} label="Buffer Pool" accent="text-cyan-300 bg-cyan-500/10">
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                ['Total', step.buffer.totalPages, 'text-white/70'],
                                                ['Used', step.buffer.usedPages, 'text-emerald-300'],
                                                ['Dirty', step.buffer.dirtyPages, 'text-amber-300'],
                                                ['Evicted', step.buffer.evictedPages, 'text-rose-300'],
                                            ].map(([k, v, c]) => (
                                                <div key={k as string} className="bg-black/40 rounded-xl p-2 text-center border border-white/5">
                                                    <div className={cn('text-lg font-black', c)}>{v}</div>
                                                    <div className="text-[9px] text-muted-foreground">{k}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </SectionBox>
                                )}
                            </div>

                            {/* RIGHT: Session Monitor */}
                            <div className="flex flex-col gap-4">
                                <SectionBox icon={Activity} label="Monitor de Sesiones (sys.dm_exec_requests)" accent="text-cyan-300 bg-cyan-500/10">
                                    <div className="flex flex-col gap-2">
                                        <AnimatePresence>
                                            {step.spids.map(s => (
                                                <motion.div key={s.spid}
                                                    layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                                                    className={cn('rounded-xl border p-3 flex flex-col gap-2', STATUS_STYLE[s.status] ?? STATUS_STYLE.idle)}>
                                                    {/* SPID header row */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', DOT[s.status] ?? DOT.idle)} />
                                                        <span className="font-mono text-xs font-black text-cyan-400 shrink-0">SPID {s.spid}</span>
                                                        {s.label && <span className="text-xs text-white/70 flex-1 min-w-0 truncate">{s.label}</span>}
                                                        <span className={cn('ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                                                            s.status === 'running'    ? 'bg-emerald-500/20 text-emerald-400' :
                                                            s.status === 'suspended'  ? 'bg-rose-500/20 text-rose-400' :
                                                            s.status === 'contention' ? 'bg-amber-500/20 text-amber-400' :
                                                            s.status === 'virt'       ? 'bg-violet-500/20 text-violet-400' :
                                                                                        'bg-white/10 text-white/40')}>
                                                            {s.status}
                                                        </span>
                                                    </div>
                                                    {/* Tags row */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {s.waitType && (
                                                            <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                                                                ⏳ {s.waitType}
                                                            </span>
                                                        )}
                                                        {s.blockedBy && (
                                                            <span className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md text-[10px] font-mono">
                                                                🔒 blocked by SPID {s.blockedBy}
                                                            </span>
                                                        )}
                                                        {s.planStatus && (
                                                            <span className={cn('px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold',
                                                                s.planStatus === 'cached'      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
                                                                s.planStatus === 'evicted'     ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' :
                                                                                                 'bg-amber-500/20 border-amber-500/30 text-amber-300 animate-pulse')}>
                                                                📋 plan: {s.planStatus}
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

                        {/* Controls */}
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                            <button onClick={reset} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors" title="Reset">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setPlaying(false); prev(); }} disabled={stepIdx === 0}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-lg disabled:opacity-30 transition-all border border-white/10">
                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                </button>
                                <button onClick={() => setPlaying(p => !p)}
                                    className={cn('px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all border',
                                        playing ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : `${clrBg} ${clrText} border-current/30`)}>
                                    {playing ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Auto Play</>}
                                </button>
                                <button onClick={() => { setPlaying(false); next(); }} disabled={stepIdx === total - 1}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-lg disabled:opacity-30 transition-all border border-white/10">
                                    Siguiente <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className={cn('text-xs font-bold px-3 py-1.5 rounded-lg border', clrBg, clrText)}>
                                {stepIdx === total - 1 ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completo</span> : `${stepIdx + 1} / ${total}`}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── SCHEMA PANEL ──────────────────────────────────────── */}
                {activePanel === 'schema' && (
                    <motion.div key="schema" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <SectionBox icon={Database} label="Tabla / Schema" accent="text-emerald-300 bg-emerald-500/10">
                            <pre className="text-[11px] font-mono text-white/80 leading-relaxed whitespace-pre-wrap overflow-x-auto">{rc.schema}</pre>
                        </SectionBox>
                        <SectionBox icon={Code2} label="Query Problemática" accent="text-amber-300 bg-amber-500/10">
                            <pre className="text-[11px] font-mono text-white/80 leading-relaxed whitespace-pre-wrap overflow-x-auto">{rc.query}</pre>
                        </SectionBox>
                    </motion.div>
                )}

                {/* ── FIX PANEL ─────────────────────────────────────────── */}
                {activePanel === 'fix' && (
                    <motion.div key="fix" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <SectionBox icon={Search} label="T-SQL de Detección (sys.dm_exec_requests)" accent="text-blue-300 bg-blue-500/10">
                            <pre className="text-[11px] font-mono text-white/80 leading-relaxed whitespace-pre-wrap overflow-x-auto">{rc.detectionQuery}</pre>
                        </SectionBox>
                        <SectionBox icon={Wrench} label="Resolución / Best Practice" accent="text-emerald-300 bg-emerald-500/10">
                            <pre className="text-[11px] font-mono text-white/80 leading-relaxed whitespace-pre-wrap overflow-x-auto">{resolution ?? t(rc.resolutionKey as any)}</pre>
                        </SectionBox>
                    </motion.div>
                )}
            </AnimatePresence>
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
