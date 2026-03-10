import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, FileWarning, ShieldCheck, HardDrive, Cpu, Code2, AlertTriangle, ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { TSqlModal } from '../Shared/TSqlModal';
import { REAL_CASES, CASE_BEST_PRACTICES, type SpidCard } from './realCasesData';

// ── colour helpers ──────────────────────────────────────────────────────────
const COLOR: Record<string, { ring: string; bg: string; text: string; glow: string }> = {
    amber: { ring: 'border-amber-500/50', bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]' },
    rose: { ring: 'border-rose-500/50', bg: 'bg-rose-500/20', text: 'text-rose-400', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]' },
    purple: { ring: 'border-purple-500/50', bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]' },
    cyan: { ring: 'border-cyan-500/50', bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.35)]' },
    red: { ring: 'border-red-500/50', bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.35)]' },
    orange: { ring: 'border-orange-500/50', bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.35)]' },
    yellow: { ring: 'border-yellow-500/50', bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.35)]' },
    blue: { ring: 'border-blue-500/50', bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.35)]' },
    violet: { ring: 'border-violet-500/50', bg: 'bg-violet-500/20', text: 'text-violet-400', glow: 'shadow-[0_0_12px_rgba(139,92,246,0.35)]' },
    emerald: { ring: 'border-emerald-500/50', bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]' },
};

const STATUS_STYLE: Record<SpidCard['status'], string> = {
    running: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    suspended: 'bg-rose-500/15    border-rose-500/50    text-rose-300    animate-pulse',
    evicted: 'bg-purple-500/15  border-purple-500/40  text-purple-300',
    idle: 'bg-white/5        border-white/10       text-white/30    opacity-50',
    contention: 'bg-amber-500/15   border-amber-500/50   text-amber-300   animate-pulse',
    growth: 'bg-yellow-500/15  border-yellow-500/50  text-yellow-300  animate-pulse',
    virt: 'bg-violet-500/15  border-violet-500/50  text-violet-300  animate-pulse',
};

function SpidRow({ s }: { s: SpidCard }) {
    return (
        <motion.div
            key={s.spid}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className={cn('flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold', STATUS_STYLE[s.status])}
        >
            <span className="font-mono text-cyan-400 w-16 shrink-0">SPID {s.spid}</span>
            <span className="flex-1 mx-2 text-white/70 truncate">{s.label ?? ''}</span>
            <div className="flex items-center gap-2 ml-auto shrink-0">
                {s.waitType && <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-mono">{s.waitType}</span>}
                {s.blockedBy && <span className="text-amber-300 text-[10px]">← {s.blockedBy}</span>}
                {s.planStatus && (
                    <span className={cn('px-1.5 py-0.5 rounded border text-[10px] font-mono',
                        s.planStatus === 'cached' ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' :
                            s.planStatus === 'evicted' ? 'text-rose-300    bg-rose-500/20    border-rose-500/30' :
                                'text-amber-300   bg-amber-500/20   border-amber-500/30 animate-pulse'
                    )}>PLAN:{s.planStatus.toUpperCase()}</span>
                )}
                <span className={cn('px-1.5 py-0.5 rounded uppercase text-[10px]',
                    s.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' :
                        s.status === 'suspended' ? 'bg-rose-500/20    text-rose-400    animate-pulse' :
                            s.status === 'evicted' ? 'bg-purple-500/20  text-purple-400' :
                                s.status === 'contention' ? 'bg-amber-500/20   text-amber-400   animate-pulse' :
                                    s.status === 'growth' ? 'bg-yellow-500/20  text-yellow-400  animate-pulse' :
                                        s.status === 'virt' ? 'bg-violet-500/20  text-violet-400  animate-pulse' :
                                            'bg-white/10        text-white/40'
                )}>{s.status}</span>
            </div>
        </motion.div>
    );
}

export function DBAScenarios() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'pageSplit' | 'ifi' | 'creation' | 'realCases'>('pageSplit');

    // Page Split State
    const [fillFactor, setFillFactor] = useState(100);
    const [pages, setPages] = useState<number[][]>([[1, 2, 3, 4, 5]]);
    const maxRows = 6;

    // IFI State
    const [ifiEnabled, setIfiEnabled] = useState(false);
    const [dbStatus, setDbStatus] = useState<'idle' | 'creating' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [isTsqlOpen, setIsTsqlOpen] = useState(false);

    // Real Cases State
    const [caseIdx, setCaseIdx] = useState(0);
    const [stepIdx, setStepIdx] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [autoMode, setAutoMode] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const activeCase = REAL_CASES[caseIdx];
    const totalSteps = activeCase.steps.length;
    const currentStep = activeCase.steps[stepIdx];

    const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const resetCase = () => {
        stopTimer();
        setStepIdx(0);
        setPlaying(false);
    };

    const startAuto = () => {
        setPlaying(true);
        timerRef.current = setInterval(() => {
            setStepIdx(p => {
                if (p >= totalSteps - 1) {
                    stopTimer();
                    setPlaying(false);
                    return p;
                }
                return p + 1;
            });
        }, 2200);
    };

    const handlePlay = () => {
        if (playing) { stopTimer(); setPlaying(false); return; }
        if (stepIdx >= totalSteps - 1) setStepIdx(0);
        startAuto();
    };

    useEffect(() => { resetCase(); }, [caseIdx]);
    useEffect(() => () => stopTimer(), []);

    // Page split
    const insertRow = () => {
        let np = [...pages]; let lp = [...np[np.length - 1]];
        const max = Math.ceil(maxRows * (fillFactor / 100));
        if (lp.length >= max) {
            const mid = Math.floor(lp.length / 2);
            np[np.length - 1] = lp.slice(0, mid);
            np.push([...lp.slice(mid), lp.slice(mid).length + mid + 1]);
        } else { lp.push(lp.length + 1); np[np.length - 1] = lp; }
        setPages(np);
    };
    const resetPages = () => setPages([[1, 2]]);
    const createDatabase = () => { setDbStatus('creating'); setProgress(0); };
    const frag = Math.round(pages.length > 1 ? (pages.filter(p => (p.length / maxRows) < 0.8).length / pages.length) * 100 : 0);

    useEffect(() => {
        if (dbStatus === 'creating') {
            const step = ifiEnabled ? 100 : 5;
            const iv = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(iv); setDbStatus('done'); return 100; } return Math.min(100, p + step); }), 100);
            return () => clearInterval(iv);
        }
    }, [dbStatus, ifiEnabled]);

    const c = COLOR[activeCase.color];

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400">{t('dbaTitle')}</h2>
                <p className="text-muted-foreground">{t('dbaDescription')}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap border-b border-white/10 pb-4">
                {(['pageSplit', 'ifi', 'creation'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={cn('px-4 py-2 rounded-lg font-bold transition-all text-sm',
                            activeTab === tab ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-white/5 text-muted-foreground hover:bg-white/10')}>
                        {t(tab === 'pageSplit' ? 'tabPageSplit' : tab === 'ifi' ? 'tabIfi' : 'tabCreation')}
                    </button>
                ))}
                <button onClick={() => { setActiveTab('realCases'); resetCase(); }}
                    className={cn('px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-1.5',
                        activeTab === 'realCases' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-muted-foreground hover:bg-white/10')}>
                    <AlertTriangle className="w-3.5 h-3.5" />{t('tabRealCases')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">

                {/* ── PAGE SPLIT ── */}
                {activeTab === 'pageSplit' && (
                    <div className="glass-panel p-6 rounded-2xl border-rose-500/30 flex flex-col gap-6">
                        <div className="flex justify-between items-start flex-col lg:flex-row gap-4">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                                    <FileWarning className="w-5 h-5 text-rose-400" />{t('pageSplitTitle')}
                                    <button onClick={() => setIsTsqlOpen(true)} className="ml-4 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"><Code2 className="w-3.5 h-3.5" />{t('viewTsql')}</button>
                                </h3>
                                <p className="text-sm text-muted-foreground">{t('pageSplitDesc')}</p>
                            </div>
                            <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/10 flex-wrap">
                                <div className="flex flex-col gap-1 w-32">
                                    <label className="text-xs text-muted-foreground font-bold">{t('fillfactorLabel')}: {fillFactor}%</label>
                                    <input type="range" min="50" max="100" step="10" value={fillFactor} onChange={e => setFillFactor(Number(e.target.value))} className="accent-rose-500" />
                                </div>
                                <div className="flex flex-col px-2">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('fragmentationLabel')}</span>
                                    <span className={cn('text-xl font-black', frag > 50 ? 'text-rose-500' : frag > 20 ? 'text-amber-500' : 'text-emerald-500')}>{frag}%</span>
                                </div>
                                <button onClick={insertRow} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded font-bold transition-colors">{t('insertRowBtn')}</button>
                                <button onClick={resetPages} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-muted-foreground rounded transition-colors">{t('resetBtn')}</button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-6 items-start">
                            <AnimatePresence>
                                {pages.map((page, i) => (
                                    <motion.div key={i} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                        className={cn('w-44 h-60 border-2 rounded-xl flex flex-col p-2 gap-1 bg-black/40 relative overflow-hidden',
                                            page.length >= Math.ceil(maxRows * (fillFactor / 100)) ? 'border-rose-500/50' : 'border-emerald-500/30')}>
                                        <div className="text-xs font-bold text-center border-b border-white/10 pb-1 mb-1 text-muted-foreground">Page {i + 1}</div>
                                        <AnimatePresence>
                                            {page.map((row, j) => (
                                                <motion.div key={row} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/20 text-emerald-300 text-xs p-1.5 rounded border border-emerald-500/30 flex justify-between">
                                                    <span>{t('rowData')}</span><span className="opacity-50">#{j + 1}</span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <div className="flex-1" />
                                        <div className="text-[10px] text-muted-foreground/50 border-t border-white/10 pt-1 mt-1 flex justify-between px-1">
                                            <span>{t('usedLabel')}: {Math.round((page.length / maxRows) * 100)}%</span>
                                            <span className={page.length >= Math.ceil(maxRows * (fillFactor / 100)) ? 'text-rose-400 font-bold' : ''}>{t('maxLabel')}: {fillFactor}%</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* ── IFI ── */}
                {activeTab === 'ifi' && (
                    <div className="glass-panel p-6 rounded-2xl border-orange-500/30 flex flex-col gap-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-orange-400">
                            <ShieldCheck className="w-5 h-5" />{t('ifiTitle')}
                            <button onClick={() => setIsTsqlOpen(true)} className="ml-4 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"><Code2 className="w-3.5 h-3.5" />{t('viewTsql')}</button>
                        </h3>
                        <p className="text-muted-foreground">{t('ifiDesc')}</p>
                        <div className="bg-black/40 p-6 rounded-xl border border-white/10 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-12 h-6 rounded-full p-1 cursor-pointer transition-colors', ifiEnabled ? 'bg-emerald-500' : 'bg-white/10')} onClick={() => setIfiEnabled(x => !x)}>
                                        <motion.div className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: ifiEnabled ? 24 : 0 }} />
                                    </div>
                                    <span className="font-bold">{t('enableIfi')}</span>
                                </div>
                                <button onClick={createDatabase} disabled={dbStatus === 'creating'} className="px-6 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 rounded-lg font-bold transition-all disabled:opacity-50">{t('allocateBtn')}</button>
                            </div>
                            {dbStatus !== 'idle' && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className={dbStatus === 'done' ? 'text-emerald-400' : 'text-orange-400 animate-pulse'}>
                                            {dbStatus === 'creating' ? (ifiEnabled ? 'Calling SetFileValidData()...' : t('zeroingDisk')) : t('allocationComplete')}
                                        </span>
                                        <span className="text-muted-foreground">10,000 MB</span>
                                    </div>
                                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                        <motion.div className={cn('h-full', ifiEnabled ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-orange-500')} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        {!ifiEnabled && dbStatus === 'creating' && <p className="text-xs text-rose-400">{t('noticeDelay')}</p>}
                                        <div className="flex items-center gap-2 text-xs font-mono ml-auto bg-black/50 px-3 py-1.5 rounded text-muted-foreground border border-white/10">
                                            <Cpu className="w-3 h-3 text-cyan-400" />{t('apiCallLabel')}
                                            <span className={ifiEnabled ? 'text-emerald-400 font-bold' : 'text-orange-400'}>{ifiEnabled ? 'SetFileValidData(hFile, 10GB)' : 'WriteFile(hFile, 0x00...)'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── CREATION ── */}
                {activeTab === 'creation' && (
                    <div className="glass-panel p-6 rounded-2xl border-purple-500/30 flex flex-col gap-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400"><Database className="w-5 h-5" />{t('dbCreationTitle')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-black/40 p-5 border border-white/10 rounded-xl space-y-4">
                                <h4 className="font-bold text-emerald-400 flex items-center gap-2"><HardDrive className="w-4 h-4" />{t('mdfTitle')}</h4>
                                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-2"><li>{t('mdfDesc1')}</li><li>{t('mdfDesc2')}</li><li>{t('mdfDesc3')}</li><li>{t('mdfDesc4')}</li></ul>
                            </div>
                            <div className="bg-black/40 p-5 border border-white/10 rounded-xl space-y-4">
                                <h4 className="font-bold text-amber-400 flex items-center gap-2"><Zap className="w-4 h-4" />{t('ldfTitle')}</h4>
                                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-2"><li>{t('ldfDesc1')}</li><li>{t('ldfDesc2')}</li><li>{t('ldfDesc3')}</li><li><strong className="text-rose-400">{t('ldfDesc4')}</strong></li></ul>
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg font-mono text-sm border border-white/10">
                            <span className="text-blue-400">CREATE DATABASE</span> <span className="text-white">SalesDB</span><br />
                            <span className="text-blue-400">ON PRIMARY</span><br />
                            &nbsp;&nbsp;(<span className="text-purple-400">NAME</span> = <span className="text-emerald-300">'SalesDB_Data'</span>,<br />
                            &nbsp;&nbsp;&nbsp;<span className="text-purple-400">FILENAME</span> = <span className="text-emerald-300">'D:\Data\SalesDB.mdf'</span>,<br />
                            &nbsp;&nbsp;&nbsp;<span className="text-purple-400">SIZE</span> = <span className="text-white">10GB</span>, <span className="text-purple-400">FILEGROWTH</span> = <span className="text-white">1GB</span>)<br />
                            <span className="text-blue-400">LOG ON</span><br />
                            &nbsp;&nbsp;(<span className="text-purple-400">NAME</span> = <span className="text-emerald-300">'SalesDB_Log'</span>,<br />
                            &nbsp;&nbsp;&nbsp;<span className="text-purple-400">FILENAME</span> = <span className="text-emerald-300">'L:\Logs\SalesDB_log.ldf'</span>,<br />
                            &nbsp;&nbsp;&nbsp;<span className="text-purple-400">SIZE</span> = <span className="text-white">2GB</span>, <span className="text-purple-400">FILEGROWTH</span> = <span className="text-white">500MB</span>);
                        </div>
                    </div>
                )}

                {/* ── REAL CASES ── */}
                {activeTab === 'realCases' && (
                    <div className="flex flex-col gap-6">
                        {/* header */}
                        <div className="glass-panel p-5 rounded-2xl border-cyan-500/30">
                            <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2 mb-1"><AlertTriangle className="w-5 h-5" />{t('realCasesTitle')}</h3>
                            <p className="text-sm text-muted-foreground">{t('realCasesDesc')}</p>
                        </div>

                        {/* case pill selector */}
                        <div className="flex flex-wrap gap-2">
                            {REAL_CASES.map((rc, i) => {
                                const col = COLOR[rc.color];
                                return (
                                    <button key={rc.id} onClick={() => setCaseIdx(i)}
                                        className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all',
                                            caseIdx === i ? `${col.bg} ${col.text} ${col.ring} ${col.glow}` : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10')}>
                                        <span>{rc.icon}</span>{t(rc.nameKey as any)}
                                    </button>
                                );
                            })}
                        </div>

                        {/* active case panel */}
                        <div className={cn('glass-panel rounded-2xl border-2 overflow-hidden', c.ring)}>
                            {/* case header */}
                            <div className={cn('px-6 py-4 border-b border-white/5', c.bg)}>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-2xl">{activeCase.icon}</span>
                                    <h4 className={cn('text-lg font-black', c.text)}>{t(activeCase.nameKey as any)}</h4>
                                </div>
                                <p className="text-sm text-white/70">{t(activeCase.descKey as any)}</p>
                            </div>

                            <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">

                                {/* LEFT — step player */}
                                <div className="flex flex-col gap-4">
                                    {/* progress bar */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground font-bold">{t('stepLabel')} {stepIdx + 1} {t('of')} {totalSteps}</span>
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div className={cn('h-full rounded-full', c.bg.replace('/20', '/80'))} animate={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }} />
                                        </div>
                                    </div>

                                    {/* controls */}
                                    <div className="flex items-center gap-2">
                                        <button onClick={resetCase} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground transition-colors">
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                        <button disabled={stepIdx === 0} onClick={() => setStepIdx(p => Math.max(0, p - 1))}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold disabled:opacity-30 flex items-center gap-1 text-muted-foreground transition-colors">
                                            <ChevronLeft className="w-3.5 h-3.5" />{t('stepPrev')}
                                        </button>
                                        <button onClick={handlePlay}
                                            className={cn('px-4 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all', c.bg, c.text, c.ring)}>
                                            {playing ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" />{t('autoPlay')}</>}
                                        </button>
                                        <button disabled={stepIdx >= totalSteps - 1} onClick={() => setStepIdx(p => Math.min(totalSteps - 1, p + 1))}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold disabled:opacity-30 flex items-center gap-1 text-muted-foreground transition-colors">
                                            {t('stepNext')}<ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* log line */}
                                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 min-h-14 flex items-center font-mono text-xs">
                                        <AnimatePresence mode="wait">
                                            <motion.div key={stepIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                                className="text-white/90">
                                                <span className="text-cyan-600 mr-1.5">[{stepIdx + 1}/{totalSteps}]</span>{currentStep.log}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    {/* SPID cards */}
                                    <div className="flex flex-col gap-2 min-h-40">
                                        <AnimatePresence mode="popLayout">
                                            {currentStep.spids.map(s => <SpidRow key={s.spid} s={s} />)}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* RIGHT — detection + resolution */}
                                <div className="flex flex-col gap-4">
                                    <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                                        <h5 className={cn('text-xs font-bold uppercase tracking-wider', c.text)}>{t('detectionLabel')}</h5>
                                        <pre className="text-[11px] text-emerald-300/90 bg-black/40 p-3 rounded-lg border border-white/5 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">{activeCase.detectionQuery}</pre>
                                    </div>
                                    <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                                        <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">{t('resolutionLabel')}</h5>
                                        <pre className="text-[11px] text-amber-200/80 bg-black/40 p-3 rounded-lg border border-white/5 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">{CASE_BEST_PRACTICES[activeCase.id]}</pre>
                                    </div>
                                    <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                                        <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-400">{t('bestPracticeLabel')}</h5>
                                        <p className="text-xs text-white/70 leading-relaxed">{t(activeCase.resolutionKey as any)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <TSqlModal
                isOpen={isTsqlOpen}
                onClose={() => setIsTsqlOpen(false)}
                title={activeTab === 'pageSplit' ? t('dbaTsqlSplitTitle') : activeTab === 'ifi' ? t('dbaTsqlIfiTitle') : ''}
                description={activeTab === 'pageSplit' ? t('dbaTsqlSplitDesc') : activeTab === 'ifi' ? t('dbaTsqlIfiDesc') : ''}
                diagnosticScript={{
                    '2019': activeTab === 'pageSplit'
                        ? `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`
                        : `SELECT servicename, instant_file_initialization_enabled FROM sys.dm_server_services;`,
                    '2022': activeTab === 'pageSplit'
                        ? `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`
                        : `SELECT servicename, instant_file_initialization_enabled FROM sys.dm_server_services;`,
                    '2025': activeTab === 'pageSplit'
                        ? `SELECT dm.index_id, dm.avg_fragmentation_in_percent\nFROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, 'LIMITED') dm\nWHERE avg_fragmentation_in_percent > 10.0;`
                        : `SELECT servicename, instant_file_initialization_enabled FROM sys.dm_server_services;`,
                }}
                remediationTitle={activeTab === 'pageSplit' ? t('dbaRemediationSplitTitle') : t('dbaRemediationIfiTitle')}
                remediationScript={{
                    '2019': activeTab === 'pageSplit'
                        ? `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON);`
                        : `-- Enable via Local Security Policy → User Rights Assignment`,
                    '2022': activeTab === 'pageSplit'
                        ? `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON, RESUMABLE = ON);`
                        : `-- Enable via Local Security Policy → User Rights Assignment`,
                    '2025': activeTab === 'pageSplit'
                        ? `ALTER INDEX ALL ON TableName REBUILD WITH (FILLFACTOR = 80, ONLINE = ON, RESUMABLE = ON);`
                        : `-- Enable via Local Security Policy → User Rights Assignment`,
                }}
            />
        </div>
    );
}
